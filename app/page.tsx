import { BlogPosts } from "app/components/posts";

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        Lucas Bittencourt
      </h1>
      <p className="mb-4">
        Full-stack Software Engineer currently working with React.js, Node.js,
        PostgreSQL, Docker, TypeScript. Developing scalable and robust
        solutions.
      </p>
      <div className="my-8">
        <BlogPosts />
      </div>
    </section>
  );
}
