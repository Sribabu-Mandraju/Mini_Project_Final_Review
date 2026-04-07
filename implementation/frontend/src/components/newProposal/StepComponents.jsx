import { inputClassName, labelClassName } from "./constants";
import { getStepStatus } from "./helpers";

export const Stepper = ({ steps, activeIndex, maxReachedIndex, onStepClick }) => {
  return (
    <div className="border-b border-slate-800 pb-4">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, idx) => {
          const status = getStepStatus(idx, activeIndex, maxReachedIndex);
          const isActive = status === "active";
          const isDone = status === "done";

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onStepClick(idx)}
              disabled={status === "locked"}
              className={`flex flex-1 flex-col items-center gap-1 transition disabled:cursor-not-allowed ${
                isActive
                  ? "text-orange-300"
                  : isDone
                    ? "text-slate-300"
                    : "text-slate-500"
              } ${status === "reachable" ? "hover:text-orange-300" : ""}`}
            >
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  isActive
                    ? "bg-orange-400 text-slate-950"
                    : isDone
                      ? "bg-slate-700 text-slate-200"
                      : "bg-slate-800 text-slate-500"
                }`}
                aria-hidden="true"
              >
                {isDone ? "✓" : idx + 1}
              </span>
              <span className="text-xs font-semibold">{step.label}</span>
              {isActive ? (
                <span
                  className="h-0.5 w-full rounded-full bg-orange-400"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="h-0.5 w-full rounded-full bg-slate-800"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const Field = ({ label, hint, children }) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className={labelClassName}>{label}</label>
        {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
};

export const SectionCard = ({
  stepNumber,
  totalSteps,
  title,
  subtitle,
  children,
}) => {
  return (
    <section className="py-6">
      <div className="mb-5">
        {stepNumber != null && totalSteps != null ? (
          <p className="mb-2 text-sm font-semibold text-orange-300">
            Step {stepNumber} of {totalSteps}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
};

export const BasicInfoStep = ({
  form,
  updateForm,
  basicInfoValid,
  formattedFundsRequested,
}) => (
  <SectionCard
    stepNumber={1}
    totalSteps={4}
    title="Basic Information"
    subtitle="Tell us what happened and what support is needed."
  >
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Disaster Name">
        <input
          value={form.disasterName}
          onChange={(e) => updateForm({ disasterName: e.target.value })}
          placeholder="e.g., Hurricane Relief"
          className={inputClassName}
          autoComplete="off"
          spellCheck={false}
        />
      </Field>

      <Field label="Funds Requested (USD)">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            $
          </span>
          <input
            value={form.fundsRequested}
            onChange={(e) =>
              updateForm({
                fundsRequested: e.target.value.replace(/[^\d.]/g, ""),
              })
            }
            inputMode="decimal"
            placeholder="e.g., 100000"
            className={`${inputClassName} pl-10`}
          />
        </div>
        {form.fundsRequested ? (
          <p className="mt-2 text-xs text-slate-400">{formattedFundsRequested}</p>
        ) : null}
      </Field>
    </div>

    <div className="mt-5">
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          placeholder="Describe the disaster, its impact, and the purpose of this proposal..."
          rows={7}
          className={`${inputClassName} resize-none`}
        />
      </Field>
    </div>

    {!basicInfoValid ? (
      <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        Please enter a disaster name, a valid requested amount, and a description
        (10+ characters) to continue.
      </div>
    ) : null}
  </SectionCard>
);

export const ReviewGrid = ({ reviewData }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    {Object.entries(reviewData).map(([k, v]) => (
      <div
        key={k}
        className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {k}
        </div>
        <div className="mt-2 text-sm text-slate-100">
          {k === "Description" ? (
            <p className="whitespace-pre-wrap text-slate-200">{v}</p>
          ) : k === "Cloudinary URL" || k === "IPFS Metadata URI" ? (
            v !== "—" ? (
              <a
                href={
                  k === "IPFS Metadata URI"
                    ? `https://gateway.pinata.cloud/ipfs/${String(v).replace(
                        "ipfs://",
                        "",
                      )}`
                    : v
                }
                target="_blank"
                rel="noreferrer"
                className="break-all text-orange-300 underline underline-offset-2 hover:text-orange-200"
              >
                {v}
              </a>
            ) : (
              <span className="text-slate-200">{v}</span>
            )
          ) : (
            <span className="text-slate-200">{v}</span>
          )}
        </div>
      </div>
    ))}
  </div>
);
