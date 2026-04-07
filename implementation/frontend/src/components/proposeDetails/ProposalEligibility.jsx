import { FiCheck } from "react-icons/fi";

const ProposalEligibility = () => (
  <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
    <div className="flex items-center gap-2">
      <FiCheck className="h-5 w-5 text-slate-400" />
      <h2 className="text-lg font-semibold text-white">Eligibility Criteria</h2>
    </div>
    <p className="mt-2 text-sm text-slate-300">
      If this proposal is approved, the following criteria will determine who
      can register for aid:
    </p>

    <ul className="mt-4 space-y-3">
      <li className="flex items-start gap-3 text-sm text-slate-300">
        <FiCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
        <span>Must be located within the affected area radius</span>
      </li>
      <li className="flex items-start gap-3 text-sm text-slate-300">
        <FiCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
        <span>
          Must provide proof of residence or presence in the area during the
          disaster
        </span>
      </li>
      <li className="flex items-start gap-3 text-sm text-slate-300">
        <FiCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
        <span>
          Must demonstrate financial need or damage caused by the disaster
        </span>
      </li>
    </ul>
  </article>
);

export default ProposalEligibility;
