export default function Methods() {
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="border-b px-6 py-4">
        <a href="/" className="text-2xl font-bold text-teal-700">PhyloLoom AI</a>
        <p className="text-sm text-slate-500">Methods, Assumptions &amp; Limitations</p>
      </header>
      <div className="max-w-3xl mx-auto p-6 space-y-6 text-[15px] leading-relaxed">
        <section><h2 className="font-semibold text-lg">What this tool is — and is not</h2>
          <p>PhyloLoom AI is a <strong>reproducible research workspace for exploratory sequence analysis</strong>. Researchers and analysts can submit their own FASTA and PDB data, compute documented statistics, alignments, distances and exploratory trees, and export machine-readable results with the method parameters used. It may also be used for teaching these methods.</p>
          <p className="mt-2">It is <strong>not</strong> a clinical diagnostic system, a pathogenicity predictor, or a tool for definitive phylogenetic inference. Observed sequence differences are reported as observations only and are <strong>never</strong> labeled pathogenic or functional without external evidence, which this tool does not currently provide.</p></section>

        <section><h2 className="font-semibold text-lg">Intended research use &amp; reproducibility</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Appropriate use:</strong> preliminary sequence inspection, comparative analysis of related sequences, and hypothesis generation to guide further computational analysis.</li>
            <li><strong>Exports for downstream work:</strong> analysis results can be downloaded as JSON, and the exploratory tree can be inspected and downloaded as raw Newick. Method parameters are stated on this page so a result can be reproduced or re-computed with other software.</li>
            <li><strong>Provenance:</strong> results are labeled to distinguish computed measurements, demonstration data, experimental structures, predicted structures, and AI-generated interpretation.</li>
            <li><strong>No retention:</strong> submitted sequences are processed in server memory and are not stored in a database or written to disk (see Privacy below), so re-running an analysis requires re-submitting the input.</li>
          </ul></section>

        <section><h2 className="font-semibold text-lg">Sequence statistics (computed live)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Nucleotide composition &amp; GC%:</strong> direct counting; GC% = (G+C)/length &times; 100. Ambiguous IUPAC bases (N, R, Y…) are detected and reported, not silently discarded.</li>
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
          <p>Structures are rendered with 3Dmol.js from user-supplied PDB files, the RCSB PDB demo structure (1CRN, crambin, experimental X-ray), or a predicted structure loaded from AlphaFold DB by UniProt accession (e.g. P69905), in which case the average pLDDT reported by AlphaFold DB is displayed. Experimental and predicted structures are labeled as different evidence categories. PhyloLoom does not perform structure prediction and does not claim a submitted sequence has a known structure.</p></section>

        <section><h2 className="font-semibold text-lg">AI Research Copilot</h2>
          <p>The copilot can use <strong>Meta Muse Spark (<code>muse-spark-1.3</code>) via the Meta Model API</strong> when the backend is configured, or a <strong>clearly labeled mock provider</strong> when it is not. The provider receives the user&apos;s question and structured computed-result fields — such as sequence counts, sequence identifiers, summary statistics, comparison values and method metadata. Backend fields named <code>sequence</code>, <code>raw_sequence</code>, <code>fasta_text</code> or <code>sequences_raw</code> are removed before transmission. The copilot explains computed outputs, must not invent numerical values, and is not a clinical diagnostic tool. If the Meta provider is unavailable, timeout occurs, or the request fails, PhyloLoom may return a clearly labeled Mock fallback; computed results are unaffected. AI-generated interpretation is always visually distinguished from computed measurements.</p></section>

        <section><h2 className="font-semibold text-lg">Privacy &amp; data handling</h2>
          <p>Uploaded sequences are processed in server memory and are not stored in a database or written to disk. Do not submit confidential, clinical, or personally identifiable genomic data. When the Meta copilot is enabled, the question and structured computed results described above are sent to Meta&apos;s Model API at <code>https://api.meta.ai/v1</code>; raw sequence fields listed above are removed by the backend before transmission. Analysis itself is computed locally by the PhyloLoom backend and does not depend on the AI provider.</p></section>

        <section><h2 className="font-semibold text-lg">Input limits</h2>
          <p>FASTA: max 50 sequences, max 100,000 residues each. PDB upload: max 5 MB. FASTQ, genome assembly, and variant calling (VCF) are not supported.</p></section>

        <p className="text-xs text-slate-400">Software: Python, FastAPI, Biopython, Next.js, 3Dmol.js. Methods page v0.3.0.</p>
      </div>
    </main>
  );
}