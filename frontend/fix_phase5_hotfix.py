import pathlib

pv = pathlib.Path("src/components/ProteinViewer.tsx")
t = pv.read_text(encoding="utf-8")
changed = []

# Fix 1a: AlphaFold - await render so PREDICTED label isn't overwritten
old_af = 'setFormat("pdb"); setPdbText(pdb); render(pdb, style, resi, "pdb");'
if old_af in t:
    t = t.replace(old_af, 'setFormat("pdb"); setPdbText(pdb); await render(pdb, style, resi, "pdb");')
    changed.append("alphafold-await")

# Fix 1b: 1CRN demo - same overwrite bug
old_demo = 'setPdbText(pdb); render(pdb);'
if old_demo in t:
    t = t.replace(old_demo, 'setPdbText(pdb); await render(pdb);')
    changed.append("demo-await")

pv.write_text(t, encoding="utf-8")

# Fix 2: clamp negative branch lengths to 0 on Newick export
er = pathlib.Path("src/components/ExportResults.tsx")
e = er.read_text(encoding="utf-8")
old_dl = 'onClick={() => newick && download("phyloloom-tree.newick", newick)}'
new_dl = r'onClick={() => newick && download("phyloloom-tree.newick", newick.replace(/:-[0-9.eE+\-]+/g, ":0"))}'
if old_dl in e:
    e = e.replace(old_dl, new_dl)
    er.write_text(e, encoding="utf-8")
    changed.append("newick-clamp")

print("Patched:", ", ".join(changed) if changed else "nothing matched - paste me the render() lines")