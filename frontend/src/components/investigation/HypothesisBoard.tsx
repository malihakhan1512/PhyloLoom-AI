"use client";

export type HypothesisCard = {
  id: string;
  title: string;
  classification: string;
  status: string;
  observation: string;
  hypothesis: string;
  alternatives: string[];
  proposed_test: {
    required_inputs: string[];
    method: string;
    null_hypothesis: string;
    alternative_hypothesis: string;
    assumptions: string[];
    expected_outputs: string[];
    falsification_criteria: string;
  };
  falsifier: string;
  citation_ids: string[];
  missing_evidence: string[];
};

export default function HypothesisBoard({ cards }: { cards: HypothesisCard[] }) {
  if (!cards.length) {
    return (
      <p className="text-sm text-slate-500">
        Hypothesis cards: unavailable. No citation-backed hypothesis has been generated.
      </p>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {cards.map((card) => (
        <article key={card.id} className="border rounded-xl p-4 bg-amber-50">
          <div className="flex flex-wrap gap-2 items-center">
            <h3 className="font-semibold">{card.title}</h3>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              {card.classification}
            </span>
            <span className="text-xs bg-white border px-2 py-0.5 rounded">
              Status: {card.status}
            </span>
          </div>

          <p className="text-sm mt-3">
            <strong>Observation:</strong> {card.observation}
          </p>

          <p className="text-sm mt-2">
            <strong>Hypothesis:</strong> {card.hypothesis}
          </p>

          <div className="text-sm mt-3">
            <strong>Alternatives / confounders</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {card.alternatives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="text-sm mt-3 bg-white border rounded p-3">
            <p><strong>Proposed test:</strong> {card.proposed_test.method}</p>
            <p className="mt-2"><strong>Null:</strong> {card.proposed_test.null_hypothesis}</p>
            <p className="mt-1"><strong>Alternative:</strong> {card.proposed_test.alternative_hypothesis}</p>
            <p className="mt-2"><strong>Falsifier:</strong> {card.falsifier}</p>
            <p className="mt-1"><strong>Falsification criteria:</strong> {card.proposed_test.falsification_criteria}</p>
          </div>

          <div className="text-sm mt-3">
            <strong>Missing evidence</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {card.missing_evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Evidence citations: {card.citation_ids.map((id) => (
              <code key={id} className="mr-1">{id}</code>
            ))}
          </p>
        </article>
      ))}
    </div>
  );
}