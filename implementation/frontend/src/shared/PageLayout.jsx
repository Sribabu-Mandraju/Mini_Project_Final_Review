const PageLayout = ({ title, description, children }) => {
  return (
    <div className="bg-slate-950 text-slate-100">
      <main id="top" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <div className="mb-5 h-1 w-20 rounded-full bg-orange-400/80" />
          <h1 className="text-3xl font-semibold text-white lg:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">{description}</p>
          <div className="mt-8">{children}</div>
        </section>
      </main>
    </div>
  );
};

export default PageLayout;
