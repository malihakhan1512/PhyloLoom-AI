
export default function Methods() {
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="border-b px-6 py-4">
        <a href="/" className="text-2xl font-bold text-teal-700">PhyloLoom AI</a>
        <p className="text-sm text-slate-500">Methods, Assumptions &amp; Limitations</p>
      </header>
      <div className="max-w-3xl mx-auto p-6 space-y-6 text-[15px] leading-relaxed">
        <section><h2 className="font-semibold text-lg">What this tool is — and is not</h2>
          <p>PhyloLoom AI is a <strong>research-support and education tool</strong>. It is not a clinical diagnostic system. Observed sequence differences are reported as observations only and are <strong>never</strong> labeled pathogenic or functional without external evidence, which this tool does not currently provide.</p></section>
        <section><h2 className="font-semibold text-lg">Sequence statistics (computed live)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Nucleotide composition &amp; GC%:</strong> direct counting; GC% = (G+C)/length × 100. Ambiguous IUPAC bases (N, R, Y…) are detected and reported, not silently discarded.</li>
            <li><strong>Protein molecular weight:</strong> Biopython <code>ProtParam</code> — sum of residue masses + water. Ambiguous residues are substituted for this calculation only and this is documented in the API response.</li>
            <li><strong>Hydrophobicity (GRAVY):</strong> mean Kyte-Doolittle hydropathy. A summary statistic, not a structure or function prediction.</li>
          </ul></section>
        <section><h2 className="font-semibold text-lg">Pairwise comparison</h2>
          <p>Global Needleman-Wunsch alignment (Biopython <code>PairwiseAligner</code>, match +2, mismatch −1, gap open −2, gap extend −0.5). Substitutions, insertions, and deletions are read directly from the alignment. Identity % = matched columns / aligned length. Assumption: the two sequences are globally homologous. For highly diverged or multi-domain sequences, a local alignment would be more appropriate.</p></section>
        <section><h2 className="font-semibold text-lg">Evolutionary exploration</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Distance:</strong> p-distance = differing positions / compared positions on pairwise global alignments, gap-containing columns excluded.</li>
            <li><strong>Tree:</strong> Neighbor-Joining (Biopython) on the p-distance matrix.</li>
            <li><strong>Limitations:</strong> p-distance does not correct for multiple substitutions at the same site, so distances are underestimated for diverged sequences. Pairwise alignments are used instead of a true multiple sequence alignment. The resulting tree is <strong>exploratory</strong> — a hypothesis-generating visualization, not a definitive evolutionary history. No bootstrap support values are computed.</li>
          </ul></section>
        <section><h2 className="font-semibold text-lg">Protein structure</h2>
          <p>Structures are rendered with 3Dmol.js from user-supplied PDB files or the RCSB PDB demo structure (1CRN, crambin, experimental X-ray). Experimental and predicted structures are labeled as different evidence categories. PhyloLoom does not perform structure prediction and does not claim a submitted sequence has a known structure.</p></section>
        <section><h2 className="font-semibold text-lg">AI Research Copilot</h2>
          <p>The copilot currently uses a <strong>clearly labeled mock provider</strong> that returns no biological claims. When a real provider is connected, it receives only computed results from this backend and must not invent numerical values. AI-generated interpretation is always visually distinguished from computed measurements.</p></section>
        <section><h2 className="font-semibold text-lg">Privacy &amp; data handling</h2>
          <p>Uploaded sequences are processed in server memory and are not stored in a database or written to disk. Do not submit confidential, clinical, or personally identifiable genomic data. Sequence data is not sent to any external AI provider in the current version.</p></section>
        <section><h2 className="font-semibold text-lg">Input limits</h2>
          <p>FASTA: max 50 sequences, max 100,000 residues each. PDB upload: max 5 MB. FASTQ, genome assembly, and variant calling (VCF) are not supported.</p></section>
        <p className="text-xs text-slate-400">Software: Python, FastAPI, Biopython, Next.js, 3Dmol.js. Methods page v0.1.0.</p>
      </div>
    </main>
  );
}
