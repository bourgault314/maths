const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const { createAudit } = require('./helpers/moulin-harness.cjs');

const html = fs.readFileSync(__dirname + '/../outils/plateaux_manipulation/moulin_pythagore.html', 'utf8');
const options = [...html.matchAll(/<option value="([^"]+)"(?: selected)?>(\d+)\. ([^<]+)<\/option>/g)];

function fiche(audit, puzzle) {
  const m = audit.setup(puzzle);
  audit.api.state.moulins.R = audit.api.buildMoulin('R', m.A.x + m.mold.b + 2 * m.mold.a + 170, m.A.y, m.mold.b, m.mold.a / m.mold.b);
  return [...audit.api.buildEnonceHTML().matchAll(/<section class="page">([\s\S]*?)<\/section>/g)].map(m => m[1]);
}

test('les quatorze fiches partagent exactement leurs quatre pages de cours', () => {
  const audit = createAudit();
  const premieres = new Set();
  let reference;
  for (const [ , puzzle ] of options) {
    const pages = fiche(audit, puzzle);
    assert.equal(pages.length, 5, puzzle);
    reference ??= pages.slice(1);
    assert.deepEqual(pages.slice(1), reference, puzzle);
    assert.ok(pages[0].includes(audit.api.PUZZLES[puzzle].name), puzzle + ' garde son titre');
    assert.ok(pages[0].includes('puzzle=' + puzzle + '&amp;mode=eleves'), puzzle + ' garde son adresse');
    assert.equal((pages[0].match(/class="piece"/g) || []).length, 2 * audit.api.state.moulins.L.pieces.length);
    premieres.add(pages[0]);
  }
  assert.equal(premieres.size, 14, 'les quatorze premières pages restent distinctes');
  assert.ok(reference[1].includes('AB = 5 cm'));
  assert.ok(reference[1].includes('AC = 12 cm'));
  assert.equal((reference[3].match(/class="miniCell"/g) || []).length, 8);
});

test('les moulins isocèles gardent leurs carrés égaux uniquement dans le puzzle', () => {
  const audit = createAudit();
  for (const puzzle of ['moulinIsocele', 'sixEquilibre', 'tangram']) {
    const pages = fiche(audit, puzzle);
    const puzzleSquares = [...pages[0].matchAll(/<rect [^>]*width="([^"]+)"[^>]*class="sq"/g)].map(m => Number(m[1]));
    assert.equal(puzzleSquares.length, 4);
    assert.ok(puzzleSquares.every(x => x === puzzleSquares[0]), puzzle);
    const lesson = pages.slice(3).join('');
    const blanks = [...lesson.matchAll(/<g>([\s\S]*?)<\/g>/g)];
    assert.equal(blanks.length, 10, 'deux grands moulins et huit mini-moulins');
    for (const [ , svg ] of blanks) {
      const sides = [...svg.matchAll(/<rect class="boardLine"[^>]*width="([^"]+)"/g)].map(m => Number(m[1])).sort((a,b) => a-b);
      assert.equal(sides.length, 2);
      const polygon = svg.match(/<polygon class="boardLine" points="([^"]+)"/)[1].split(' ').map(p => p.split(',').map(Number));
      const area = Math.abs(polygon.reduce((sum, [x,y], i) => {
        const [u,v] = polygon[(i+1)%polygon.length];
        return sum + x*v-y*u;
      }, 0))/2;
      assert.ok(0 < sides[0] && sides[0] < sides[1] && sides[1] < Math.sqrt(area), 'petit, moyen et grand carrés distincts');
      assert.ok(Math.abs(area - sides[0]**2 - sides[1]**2) < 0.01, 'les aires respectent Pythagore');
      assert.ok(svg.includes('class="rightAngle"'));
      assert.equal((svg.match(/class="abc"/g) || []).length, 3);
    }
  }
});

test('les supports vides sont indépendants du plateau et ne le modifient pas', () => {
  const audit = createAudit();
  fiche(audit, 'quatreIdentiques');
  const before = JSON.stringify(audit.api.state.moulins);
  const reference = [audit.api.buildEmptyDoubleSVG(), audit.api.buildSingleSkeletonSVG()];
  assert.equal(JSON.stringify(audit.api.state.moulins), before);
  audit.api.state.moulins = null;
  audit.api.state.puzzle = 'moulinIsocele';
  assert.deepEqual([audit.api.buildEmptyDoubleSVG(), audit.api.buildSingleSkeletonSVG()], reference);
  assert.equal(audit.api.state.moulins, null);
  assert.equal(audit.api.state.puzzle, 'moulinIsocele');
});

test('le découpage croisé ouvre la série et les titres suivent les numéros du menu', () => {
  const audit = createAudit();
  assert.equal(options.length, 14);
  assert.equal(options[0][1], 'quatreIdentiques');
  assert.equal(audit.api.state.puzzle, 'quatreIdentiques');
  assert.ok(options[0][0].includes(' selected>'));
  for (const [ , puzzle, numero ] of options) {
    if (audit.api.ENONCES[puzzle]) {
      assert.ok(audit.api.ENONCES[puzzle].title.startsWith('Puzzle ' + numero + ' — '), puzzle);
    }
  }
});
