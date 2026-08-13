/* photowrapper
   pinned deps, vendored unmodified in ./script/ : JSZip 3.10.1, qrcodejs 1.0.0 */

;(function () {
	'use strict'

	const HOURS = { '1h': 1, '12h': 12, '24h': 24, '72h': 72 }
	const GB = 1024 * 1024 * 1024
	const MAX_BYTES = GB // litterbox accepts 1 GB per upload
	const HEAVY_BYTES = 300 * 1024 * 1024 // past this, warn about phone memory
	const API = 'https://litterbox.catbox.moe/resources/internals/api.php'
	const ZIP_NAME = 'photowrapper.zip'
	const QR_NAME = 'photowrapper-qr.png'

	const $ = id => document.getElementById(id)

	const el = {
		dropzone: $('dropzone'),
		fileInput: $('fileInput'),
		tray: $('tray'),
		frameCount: $('frameCount'),
		totalSize: $('totalSize'),
		grid: $('grid'),
		appendBtn: $('appendBtn'),
		selectAllBtn: $('selectAllBtn'),
		selbar: $('selbar'),
		selCount: $('selCount'),
		removeSelBtn: $('removeSelBtn'),
		clearSelBtn: $('clearSelBtn'),
		gaugeLabel: $('gaugeLabel'),
		gaugeFill: $('gaugeFill'),
		gaugeNote: $('gaugeNote'),
		expiry: $('expiry'),
		deadline: $('deadline'),
		shareBtn: $('shareBtn'),
		status: $('status'),
		statusText: $('statusText'),
		fallback: $('fallback'),
		curl: $('curl'),
		result: $('result'),
		qr: $('qr'),
		savePngBtn: $('savePngBtn'),
		copyPngBtn: $('copyPngBtn'),
		countdown: $('countdown'),
		depletionFill: $('depletionFill'),
		caption: $('caption'),
		link: $('link'),
		copyLinkBtn: $('copyLinkBtn'),
		history: $('history'),
		histList: $('histList'),
		clearHistBtn: $('clearHistBtn')
	}

	const HISTORY_KEY = 'photowrapper:history:v1'
	const HISTORY_CAP = 20 // safety net; entries mostly leave via the grace prune
	const HISTORY_GRACE_MS = 24 * 3600000 // how long an expired entry stays visible

	let uid = 0
	let filesVersion = 0 // bumped whenever the files array changes identity
	let gridVersion = -1 // last version painted into the grid
	let lastQr = null

	let historyItems = [] // [{ id, url, expiry, deadline, count, created }], newest first
	let histVersion = 0 // bumped whenever historyItems changes identity
	let histListVersion = -1 // last version painted into #histList

	const state = {
		files: [], // { id, file, url }
		sel: [], // selected ids
		expiry: '24h',
		busy: false,
		status: null,
		error: false,
		fallback: false,
		url: null,
		deadline: null,
		span: 0,
		sentCount: 0
	}

	/* --- formatting --- */

	function fmtBytes(b) {
		if (b < 1024) return b + ' B'
		if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
		if (b < GB) return (b / 1048576).toFixed(1) + ' MB'
		return (b / GB).toFixed(2) + ' GB'
	}

	function fmtClock(ms) {
		if (ms <= 0) return 'expired'
		const s = Math.floor(ms / 1000)
		const p = n => String(n).padStart(2, '0')
		return (
			p(Math.floor(s / 3600)) +
			':' +
			p(Math.floor((s % 3600) / 60)) +
			':' +
			p(s % 60)
		)
	}

	function plural(n, word) {
		return n + ' ' + word + (n === 1 ? '' : 's')
	}

	function makeId() {
		return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
	}

	function dayDiff(a, b) {
		const d1 = new Date(a.getFullYear(), a.getMonth(), a.getDate())
		const d2 = new Date(b.getFullYear(), b.getMonth(), b.getDate())
		return Math.round((d2 - d1) / 86400000)
	}

	// "at 4:12 PM" / "tomorrow at 4:12 PM" / "Saturday at 4:12 PM" — the design
	// only names today and tomorrow, but 72h can land further out than that
	function fmtWhen(hours) {
		const now = new Date()
		const then = new Date(now.getTime() + hours * 3600000)
		const time = then.toLocaleTimeString([], {
			hour: 'numeric',
			minute: '2-digit'
		})
		const days = dayDiff(now, then)
		if (days === 0) return 'at ' + time
		if (days === 1) return 'tomorrow at ' + time
		return then.toLocaleDateString([], { weekday: 'long' }) + ' at ' + time
	}

	/* --- derived --- */

	function totalBytes() {
		return state.files.reduce((s, f) => s + f.file.size, 0)
	}

	/* --- intake --- */

	function addFiles(list) {
		const imgs = Array.from(list || [])
			.filter(f => f.type.startsWith('image/'))
			.map(f => ({ id: ++uid, file: f, url: URL.createObjectURL(f) }))
		if (!imgs.length) return
		state.files = state.files.concat(imgs)
		filesVersion++
		render()
	}

	// dropping to zero photos also drops the result — the link no longer
	// describes anything on screen
	function afterFilesChanged() {
		filesVersion++
		state.sel = state.sel.filter(id => state.files.some(f => f.id === id))
		if (!state.files.length) {
			state.url = null
			state.status = null
			state.error = false
			state.fallback = false
		}
		render()
	}

	// surviving photos keep their selection; afterFilesChanged() drops the rest
	function removeFiles(ids) {
		const doomed = new Set(ids)
		state.files = state.files.filter(f => {
			if (!doomed.has(f.id)) return true
			URL.revokeObjectURL(f.url)
			return false
		})
		afterFilesChanged()
	}

	function toggleSel(id) {
		state.sel = state.sel.includes(id)
			? state.sel.filter(x => x !== id)
			: state.sel.concat(id)
		render()
	}

	/* --- zip + upload --- */

	// photos are already compressed, so DEFLATE costs a lot of CPU for ~nothing
	function zip(items) {
		const z = new JSZip()
		const used = new Set()
		items.forEach(({ file }) => {
			const name = file.name || 'photo.jpg'
			let base = name
			let ext = ''
			const dot = name.lastIndexOf('.')
			if (dot > -1) {
				base = name.slice(0, dot)
				ext = name.slice(dot)
			}
			let cand = name
			let n = 1
			while (used.has(cand)) cand = base + '-' + n++ + ext
			used.add(cand)
			z.file(cand, file)
		})
		return z.generateAsync({ type: 'blob', compression: 'STORE' })
	}

	async function upload(blob, expiry) {
		const form = new FormData()
		form.append('reqtype', 'fileupload')
		form.append('time', expiry)
		form.append('fileToUpload', blob, ZIP_NAME)
		const res = await fetch(API, { method: 'POST', body: form })
		if (!res.ok) throw new Error('Server responded ' + res.status)
		const text = (await res.text()).trim()
		if (!text.startsWith('http')) throw new Error(text || 'Unexpected response')
		return text
	}

	function download(blob, name) {
		const a = document.createElement('a')
		const href = URL.createObjectURL(blob)
		a.href = href
		a.download = name
		document.body.appendChild(a)
		a.click()
		a.remove()
		setTimeout(() => URL.revokeObjectURL(href), 30000)
	}

	async function share() {
		if (!state.files.length || state.busy || totalBytes() > MAX_BYTES) return
		if (typeof JSZip === 'undefined' || typeof QRCode === 'undefined') {
			state.error = true
			state.status = 'A library failed to load — try reloading the page.'
			render()
			return
		}

		state.busy = true
		state.fallback = false
		state.url = null
		state.error = false
		state.status = 'Zipping ' + plural(state.files.length, 'photo') + '…'
		render()

		try {
			const count = state.files.length
			const blob = await zip(state.files)
			state.status = 'Uploading ' + fmtBytes(blob.size) + '…'
			render()

			let url
			try {
				url = await upload(blob, state.expiry)
			} catch (e) {
				download(blob, ZIP_NAME)
				state.busy = false
				state.error = true
				state.fallback = true
				state.status = 'Upload blocked — zip saved to your device'
				render()
				return
			}

			lastQr = null
			state.busy = false
			state.status = null
			state.url = url
			state.sentCount = count
			state.span = HOURS[state.expiry] * 3600000
			state.deadline = Date.now() + state.span
			render()
			renderClock()

			pruneHistory()
			pushHistory({
				id: makeId(),
				url,
				expiry: state.expiry,
				deadline: state.deadline,
				count,
				created: Date.now()
			})
			renderHistory()
		} catch (e) {
			state.busy = false
			state.error = true
			state.status = 'Something went wrong: ' + e.message
			render()
		}
	}

	/* --- history storage ---
	   every read/write is guarded: private-mode Safari, disabled storage and
	   quota errors all throw here, and none of that may take down the share
	   flow. on any failure the app just runs with no persisted history. */

	function loadHistory() {
		try {
			const raw = localStorage.getItem(HISTORY_KEY)
			if (!raw) return []
			const parsed = JSON.parse(raw)
			if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.items)) return []
			// the cap is normally enforced on push, but a stored value can end up
			// larger than that (an older version, a manual edit) — hold the line
			// on read too rather than trusting what's on disk
			return parsed.items.slice(0, HISTORY_CAP)
		} catch (e) {
			return []
		}
	}

	function saveHistory() {
		try {
			localStorage.setItem(
				HISTORY_KEY,
				JSON.stringify({ v: 1, items: historyItems })
			)
		} catch (e) {
			// history just won't persist this change
		}
	}

	// drops entries a full day past their deadline; litterbox's own clock is
	// authoritative, ours is only an estimate, so the grace window covers drift
	function pruneHistory() {
		const now = Date.now()
		const before = historyItems.length
		historyItems = historyItems.filter(
			it => now <= it.deadline + HISTORY_GRACE_MS
		)
		if (historyItems.length !== before) {
			histVersion++
			saveHistory()
		}
	}

	function pushHistory(item) {
		historyItems.unshift(item)
		if (historyItems.length > HISTORY_CAP) historyItems.length = HISTORY_CAP
		histVersion++
		saveHistory()
	}

	function clearHistory() {
		historyItems = []
		histVersion++
		saveHistory()
	}

	/* --- QR --- */

	function paintQr() {
		if (!state.url || lastQr === state.url || typeof QRCode === 'undefined')
			return
		lastQr = state.url
		el.qr.innerHTML = ''
		new QRCode(el.qr, {
			text: state.url,
			width: 140,
			height: 140,
			colorDark: '#111111',
			colorLight: '#ffffff',
			correctLevel: QRCode.CorrectLevel.M
		})
	}

	// renders a QR into a detached node — qrcodejs's canvas backend draws
	// synchronously and doesn't need to be in the document, so this works for
	// a history entry that was never shown on screen
	function makeQrCanvas(url) {
		if (typeof QRCode === 'undefined') return null
		const holder = document.createElement('div')
		new QRCode(holder, {
			text: url,
			width: 140,
			height: 140,
			colorDark: '#111111',
			colorLight: '#ffffff',
			correctLevel: QRCode.CorrectLevel.M
		})
		return holder.querySelector('canvas')
	}

	// compose a fresh canvas rather than exporting the source element as-is:
	// 3x nearest-neighbour, a white quiet zone, and a caption strip underneath
	function composeExport(src, expiryLabel) {
		if (!src) return null
		const pad = 48
		const scale = 3
		const out = document.createElement('canvas')
		out.width = src.width * scale + pad * 2
		out.height = src.height * scale + pad * 2 + 46
		const ctx = out.getContext('2d')
		ctx.fillStyle = '#ffffff'
		ctx.fillRect(0, 0, out.width, out.height)
		ctx.imageSmoothingEnabled = false
		ctx.drawImage(src, pad, pad, src.width * scale, src.height * scale)
		ctx.fillStyle = '#555555'
		ctx.font = '500 26px ui-monospace, monospace'
		ctx.textAlign = 'center'
		ctx.fillText('expires in ' + expiryLabel, out.width / 2, out.height - pad + 4)
		return out
	}

	function savePngFrom(src, expiryLabel, btn) {
		const c = composeExport(src, expiryLabel)
		if (!c) return
		c.toBlob(b => {
			download(b, QR_NAME)
			flash(btn, 'Saved', 1600)
		}, 'image/png')
	}

	function flash(btn, label, ms) {
		const original = btn.dataset.label || btn.textContent
		btn.dataset.label = original
		btn.textContent = label
		clearTimeout(btn._flash)
		btn._flash = setTimeout(() => {
			btn.textContent = btn.dataset.label
		}, ms)
	}

	/* --- render --- */

	function renderGrid() {
		if (gridVersion === filesVersion) return
		gridVersion = filesVersion
		const frag = document.createDocumentFragment()
		state.files.forEach((f, i) => {
			const cell = document.createElement('div')
			cell.className = 'cell'
			cell.dataset.id = f.id

			const img = document.createElement('img')
			img.src = f.url
			img.alt = ''

			const num = document.createElement('div')
			num.className = 'num'
			num.textContent = String(i + 1).padStart(2, '0')

			const rm = document.createElement('button')
			rm.type = 'button'
			rm.className = 'rm'
			rm.textContent = 'x'
			rm.setAttribute('aria-label', 'Remove photo ' + (i + 1))

			cell.append(img, num, rm)
			frag.appendChild(cell)
		})
		el.grid.replaceChildren(frag)
	}

	function render() {
		const n = state.files.length
		const bytes = totalBytes()
		const ratio = bytes / MAX_BYTES
		const over = bytes > MAX_BYTES
		const near = !over && ratio > 0.8

		el.tray.hidden = n === 0

		// manifest
		el.frameCount.textContent = 'Selected — ' + plural(n, 'frame')
		el.totalSize.textContent = n ? fmtBytes(bytes) : ''
		renderGrid()
		for (const cell of el.grid.children) {
			cell.classList.toggle('on', state.sel.includes(Number(cell.dataset.id)))
		}
		el.selectAllBtn.textContent =
			n > 0 && state.sel.length === n ? 'Select none' : 'Select all'

		// selection bar
		el.selbar.hidden = state.sel.length === 0
		el.selCount.textContent = state.sel.length + ' selected'
		el.removeSelBtn.textContent = 'Remove ' + state.sel.length

		// gauge
		const gaugeColor = over
			? 'var(--err)'
			: near
				? 'var(--warn)'
				: 'var(--fg)'
		el.gaugeLabel.textContent = fmtBytes(bytes) + ' of ' + fmtBytes(MAX_BYTES)
		el.gaugeLabel.style.color = gaugeColor
		el.gaugeFill.style.width = Math.max(1.5, Math.min(100, ratio * 100)) + '%'
		el.gaugeFill.style.background = gaugeColor
		el.gaugeNote.textContent = over
			? 'Over the ' +
				fmtBytes(MAX_BYTES) +
				' limit for one link. Remove a few frames or send in two batches.'
			: near
				? 'Close to the limit. Zipping will shave a little off.'
				: bytes >= HEAVY_BYTES
					? 'Room to spare under the ' +
						fmtBytes(MAX_BYTES) +
						' limit. Batches this big can fail on phones.'
					: 'Room to spare under the ' + fmtBytes(MAX_BYTES) + ' limit.'

		// expiry + primary action
		for (const b of el.expiry.children) {
			b.classList.toggle('on', b.dataset.t === state.expiry)
		}
		el.deadline.textContent = 'Deleted ' + fmtWhen(HOURS[state.expiry])
		el.shareBtn.disabled = state.busy || over
		el.shareBtn.textContent = state.busy
			? 'Working…'
			: over
				? 'Too large for one link'
				: 'Zip and share'

		// status
		el.status.hidden = !state.status
		el.status.classList.toggle('error', state.error)
		el.statusText.textContent = state.status || ''

		// fallback
		el.fallback.hidden = !state.fallback
		if (state.fallback) {
			el.curl.textContent =
				'curl -F "reqtype=fileupload" -F "time=' +
				state.expiry +
				'" -F "fileToUpload=@' +
				ZIP_NAME +
				'" ' +
				API
		}

		// result
		el.result.hidden = !state.url
		if (state.url) {
			el.link.href = state.url
			el.link.textContent = state.url
			el.caption.textContent =
				plural(state.sentCount, 'photo') + ' · ' + state.expiry
			paintQr()
		}
	}

	function renderClock() {
		if (!state.url || !state.deadline) return
		const left = state.deadline - Date.now()
		el.countdown.textContent = fmtClock(left)
		el.depletionFill.style.width =
			(state.span ? Math.max(0, Math.min(100, (left / state.span) * 100)) : 0) +
			'%'
	}

	// rebuilds the list only when historyItems actually changed identity
	// (pushed, pruned, cleared) — not on every 1s tick
	function renderHistory() {
		el.history.hidden = historyItems.length === 0
		if (histListVersion === histVersion) return
		histListVersion = histVersion

		const now = Date.now()
		const frag = document.createDocumentFragment()

		historyItems.forEach(item => {
			const expired = now > item.deadline

			const li = document.createElement('li')
			li.className = 'hist-item' + (expired ? ' expired' : '')
			li.dataset.id = item.id

			const row = document.createElement('div')
			row.className = 'hist-row'
			const clock = document.createElement('span')
			clock.className = 'hist-clock'
			clock.textContent = expired ? 'expired' : fmtClock(item.deadline - now)
			const caption = document.createElement('span')
			caption.className = 'hist-caption'
			caption.textContent = plural(item.count, 'photo') + ' · ' + item.expiry
			row.append(clock, caption)

			// an expired link no longer resolves on litterbox's side, so it
			// isn't rendered as a clickable anchor
			const link = document.createElement(expired ? 'span' : 'a')
			link.className = 'hist-link'
			link.textContent = item.url
			if (!expired) {
				link.href = item.url
				link.target = '_blank'
				link.rel = 'noopener'
			}

			const actions = document.createElement('div')
			actions.className = 'hist-actions'
			const copyBtn = document.createElement('button')
			copyBtn.type = 'button'
			copyBtn.className = 'btn-ghost xs'
			copyBtn.dataset.action = 'copy'
			copyBtn.textContent = 'Copy link'
			copyBtn.disabled = expired
			const saveBtn = document.createElement('button')
			saveBtn.type = 'button'
			saveBtn.className = 'btn-ghost xs'
			saveBtn.dataset.action = 'save'
			saveBtn.textContent = 'Save PNG'
			saveBtn.disabled = expired
			actions.append(copyBtn, saveBtn)

			li.append(row, link, actions)
			frag.appendChild(li)
		})

		el.histList.replaceChildren(frag)
	}

	// touches only each row's clock text and expired state — a full rebuild
	// every second would wipe any "Copied"/"Saved" flash mid-display
	function renderHistoryClocks() {
		if (!historyItems.length) return
		const now = Date.now()
		let newlyExpired = false
		for (const li of el.histList.children) {
			const item = historyItems.find(it => it.id === li.dataset.id)
			if (!item) continue
			const expired = now > item.deadline
			const clock = li.querySelector('.hist-clock')
			if (clock) clock.textContent = expired ? 'expired' : fmtClock(item.deadline - now)
			if (expired && !li.classList.contains('expired')) newlyExpired = true
		}
		// a row just crossed its deadline: force the disabled buttons / link
		// swap that only a full rebuild applies
		if (newlyExpired) {
			histVersion++
			renderHistory()
		}
	}

	/* --- wiring --- */

	el.dropzone.addEventListener('click', () => el.fileInput.click())
	el.appendBtn.addEventListener('click', () => el.fileInput.click())

	// resetting the value lets the same file be picked twice in a row
	el.fileInput.addEventListener('change', e => {
		addFiles(e.target.files)
		e.target.value = ''
	})

	;['dragover', 'dragenter'].forEach(ev =>
		el.dropzone.addEventListener(ev, e => {
			e.preventDefault()
			el.dropzone.classList.add('drag')
		})
	)
	;['dragleave', 'drop'].forEach(ev =>
		el.dropzone.addEventListener(ev, e => {
			e.preventDefault()
			el.dropzone.classList.remove('drag')
		})
	)
	el.dropzone.addEventListener('drop', e => {
		if (e.dataTransfer && e.dataTransfer.files.length) {
			addFiles(e.dataTransfer.files)
		}
	})

	el.grid.addEventListener('click', e => {
		const cell = e.target.closest('.cell')
		if (!cell) return
		const id = Number(cell.dataset.id)
		// the per-cell x always removes exactly that photo, selection or not
		if (e.target.closest('.rm')) {
			e.stopPropagation()
			removeFiles([id])
			return
		}
		toggleSel(id)
	})

	el.selectAllBtn.addEventListener('click', () => {
		state.sel =
			state.sel.length === state.files.length ? [] : state.files.map(f => f.id)
		render()
	})

	el.clearSelBtn.addEventListener('click', () => {
		state.sel = []
		render()
	})

	el.removeSelBtn.addEventListener('click', () => removeFiles(state.sel))

	el.expiry.addEventListener('click', e => {
		const btn = e.target.closest('button')
		if (!btn) return
		state.expiry = btn.dataset.t
		render()
	})

	el.shareBtn.addEventListener('click', share)

	el.copyLinkBtn.addEventListener('click', () => {
		if (!state.url) return
		navigator.clipboard
			.writeText(state.url)
			.then(() => flash(el.copyLinkBtn, 'Copied', 1400))
			.catch(() => flash(el.copyLinkBtn, 'Copy failed', 1400))
	})

	el.savePngBtn.addEventListener('click', () => {
		savePngFrom(el.qr.querySelector('canvas'), state.expiry, el.savePngBtn)
	})

	el.copyPngBtn.addEventListener('click', () => {
		const c = composeExport(el.qr.querySelector('canvas'), state.expiry)
		if (!c) return
		c.toBlob(b => {
			navigator.clipboard
				.write([new ClipboardItem({ 'image/png': b })])
				.then(() => flash(el.copyPngBtn, 'Copied', 1600))
				.catch(() => flash(el.copyPngBtn, 'Copy failed', 1600))
		}, 'image/png')
	})

	// no ClipboardItem (Firefox) means no image copy at all
	if (typeof ClipboardItem === 'undefined' || !navigator.clipboard) {
		el.copyPngBtn.hidden = true
	}

	el.clearHistBtn.addEventListener('click', () => {
		clearHistory()
		renderHistory()
	})

	// Copy link / Save PNG on a history entry — delegated since rows come
	// and go with renderHistory()'s rebuilds
	el.histList.addEventListener('click', e => {
		const btn = e.target.closest('button[data-action]')
		if (!btn || btn.disabled) return
		const li = e.target.closest('.hist-item')
		const item = li && historyItems.find(it => it.id === li.dataset.id)
		if (!item) return

		if (btn.dataset.action === 'copy') {
			navigator.clipboard
				.writeText(item.url)
				.then(() => flash(btn, 'Copied', 1400))
				.catch(() => flash(btn, 'Copy failed', 1400))
		} else if (btn.dataset.action === 'save') {
			savePngFrom(makeQrCanvas(item.url), item.expiry, btn)
		}
	})

	window.addEventListener('pagehide', () => {
		state.files.forEach(f => URL.revokeObjectURL(f.url))
	})

	historyItems = loadHistory()
	pruneHistory()
	renderHistory()

	setInterval(() => {
		renderClock()
		pruneHistory()
		renderHistory()
		renderHistoryClocks()
	}, 1000)
	render()
})()
