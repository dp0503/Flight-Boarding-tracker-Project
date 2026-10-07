(function () {
  function readRows() { return [...document.querySelectorAll('#passengerTable tr')].map(row => {
    const cells = [...row.cells].map(cell => cell.textContent.trim());
    return { id: cells[0], name: cells[1], flight: cells[2], seat: cells[3], group: cells[4], priority: cells[5], type: cells[6], status: cells[7] };
  }); }
  let rows = readRows();
  if (!rows.length) return;

  const byId = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
  let frames = [], index = 0, timer = null, startedAt = 0;

  function showResults(matches) {
    byId('linearResults').innerHTML = matches.length
      ? matches.map(person => `<article class="linear-person"><span class="linear-id">${escape(person.id)} · ${escape(person.status)}</span><h3>${escape(person.name)}</h3><dl><div><dt>Flight</dt><dd>${escape(person.flight)}</dd></div><div><dt>Seat</dt><dd>${escape(person.seat)}</dd></div><div><dt>Boarding group</dt><dd>${escape(person.group)}</dd></div><div><dt>Priority</dt><dd>${escape(person.priority)}</dd></div><div><dt>Passenger type</dt><dd>${escape(person.type)}</dd></div><div><dt>Boarding status</dt><dd>${escape(person.status)}</dd></div></dl></article>`).join('')
      : '<div class="linear-empty">No passengers matched. Try another name, ID, or status filter.</div>';
    byId('linearMatches').textContent = matches.length;
  }

  function showFrame(nextIndex) {
    if (!frames.length) return;
    index = Math.max(0, Math.min(nextIndex, frames.length - 1));
    const frame = frames[index];
    byId('linearBars').innerHTML = rows.map((person, i) => {
      const state = i === frame.index && index < rows.length ? 'scan' : frame.matches.includes(i) ? 'sorted' : i < frame.index ? 'miss' : '';
      const height = Math.max(25, Number(person.status === 'Boarded' ? 5 : person.status === 'Waiting' ? 3 : 2) * 20);
      const label = `${person.id} · ${person.name} · ${person.status}`;
      return `<div class="sort-bar ${state}" role="listitem" tabindex="0" aria-label="${escape(label)}" data-label="${escape(`${person.id} · ${person.name}`)}" style="--bar-height:${height}%;--bar-index:${i}"></div>`;
    }).join('');
    byId('linearMessage').textContent = frame.note;
    byId('linearScanned').textContent = Math.min(frame.index + 1, rows.length);
    byId('linearPosition').textContent = `${Math.min(frame.index + 1, rows.length)} / ${rows.length}`;
    byId('linearBack').disabled = index === 0;
    byId('linearNext').disabled = index === frames.length - 1;
    showResults(frame.matches.map(matchIndex => rows[matchIndex]));
    if (index === frames.length - 1) {
      clearInterval(timer);
      timer = null;
      byId('linearTime').textContent = `${(performance.now() - startedAt).toFixed(4)} ms`;
    }
  }

  function runSearch() {
    clearInterval(timer);
    timer = null;
    rows = readRows();
    const query = byId('linearQuery').value.trim().toLowerCase();
    const field = byId('linearField').value;
    const status = byId('linearStatus').value;
    const matches = [];
    frames = [];
    startedAt = performance.now();
    byId('linearTime').textContent = '…';
    rows.forEach((person, i) => {
      const textMatch = !query || (field !== 'id' && person.name.toLowerCase().includes(query)) || (field !== 'name' && person.id.toLowerCase().includes(query));
      const statusMatch = status === 'all' || (status === 'waiting' && ['Waiting', 'Not Boarded'].includes(person.status)) || person.status === status;
      if (textMatch && statusMatch) matches.push(i);
      frames.push({ index: i, matches: [...matches], note: textMatch && statusMatch
        ? `Record ${i + 1}: ${person.name} matches the search.`
        : `Record ${i + 1}: checking ${person.name} (${person.status}).` });
    });
    frames.push({ index: rows.length - 1, matches: [...matches], note: `Search complete. Scanned ${rows.length} records and found ${matches.length} match${matches.length === 1 ? '' : 'es'}.` });
    byId('linearPlay').textContent = '▶ Play';
    showFrame(0);
  }

  byId('runLinear').addEventListener('click', runSearch);
  byId('linearQuery').addEventListener('keydown', event => { if (event.key === 'Enter') runSearch(); });
  byId('linearBack').addEventListener('click', () => showFrame(index - 1));
  byId('linearNext').addEventListener('click', () => showFrame(index + 1));
  byId('linearSpeed').addEventListener('input', event => { byId('linearSpeedLabel').value = `${event.target.value} ms`; });
  byId('linearPlay').addEventListener('click', () => {
    if (!frames.length) runSearch();
    if (timer) {
      clearInterval(timer); timer = null; byId('linearPlay').textContent = '▶ Play'; return;
    }
    byId('linearPlay').textContent = 'Ⅱ Pause';
    timer = setInterval(() => {
      if (index >= frames.length - 1) {
        clearInterval(timer); timer = null; byId('linearPlay').textContent = '▶ Play'; return;
      }
      showFrame(index + 1);
    }, Number(byId('linearSpeed').value));
  });
  byId('resetLinear').addEventListener('click', () => {
    clearInterval(timer); timer = null; frames = []; index = 0;
    byId('linearPlay').textContent = '▶ Play';
    byId('linearScanned').textContent = '0'; byId('linearMatches').textContent = '0'; byId('linearTime').textContent = '0 ms';
    byId('linearMessage').textContent = 'Choose a status or enter a passenger name/ID, then run the search.';
    byId('linearPosition').textContent = `0 / ${rows.length}`;
    byId('linearBack').disabled = true; byId('linearNext').disabled = true;
    byId('linearResults').innerHTML = '<div class="linear-empty">Search results will appear here.</div>';
    byId('linearBars').innerHTML = rows.map((person, i) => `<div class="sort-bar" role="listitem" aria-label="${escape(`${person.id} · ${person.name}`)}" style="--bar-height:60%;--bar-index:${i}"></div>`).join('');
  });

  byId('linearPosition').textContent = `0 / ${rows.length}`;
  byId('linearBars').innerHTML = rows.map((person, i) => `<div class="sort-bar" role="listitem" aria-label="${escape(`${person.id} · ${person.name}`)}" style="--bar-height:60%;--bar-index:${i}"></div>`).join('');
})();
