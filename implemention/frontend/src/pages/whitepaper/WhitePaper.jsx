import PageLayout from "../../shared/PageLayout";

const WhitePaper = () => {
  return (
    <PageLayout
      title="White Paper"
      description="Read the protocol vision, architecture, and implementation details of KarunyaSetu."
    >
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
        <p className="text-slate-300">
          The current technical documentation and repository are available on
          GitHub.
        </p>
        <a
          href="https://github.com/Sribabu-Mandraju/karunyasetu"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
        >
          Open White Paper Source
        </a>
      </div>
    </PageLayout>
  );
};

export default WhitePaper;
