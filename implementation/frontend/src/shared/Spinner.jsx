const Spinner = ({ className = "" }) => (
  <span
    className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent ${className}`}
    aria-hidden="true"
  />
);

export default Spinner;
