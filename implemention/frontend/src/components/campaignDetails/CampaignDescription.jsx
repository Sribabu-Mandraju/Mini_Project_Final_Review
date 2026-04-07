const CampaignDescription = ({ description }) => {
  if (!description) return null;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white">Description</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
        {description}
      </p>
    </article>
  );
};

export default CampaignDescription;
