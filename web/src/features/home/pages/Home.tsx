import Navbar from "../../../components/layout/Navbar";

const Home = () => {
  return (
    <main className="min-h-screen bg-[#0B1020]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 py-24 text-center lg:px-8">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
          Your developer journey starts here
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Master DSA.
          <span className="block text-violet-400">
            Learn. Practice. Grow.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Build strong problem-solving skills through structured learning,
          hands-on coding practice and guidance from experienced mentors.
        </p>
      </section>
    </main>
  );
};

export default Home;