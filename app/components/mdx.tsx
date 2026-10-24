import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { highlight } from "sugar-high";
import React from "react";
import { slugify } from "app/lib/slugify";
import { CodeBlock } from "app/components/code-block";
import { SectionSubheading } from "app/components/section-subheading";
import { Tab, Tabs } from "app/components/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "app/components/ui/table";

function MdxTable({ data }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {data.headers.map((header, index) => (
            <TableHead key={index}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.rows.map((row, index) => (
          <TableRow key={index}>
            {row.map((cell, cellIndex) => (
              <TableCell key={cellIndex}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CustomLink(props) {
  let href = props.href;

  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage(props) {
  return <Image alt={props.alt} className="rounded-lg" {...props} />;
}

function Code({ children, ...props }) {
  let codeHTML = highlight(children);
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}

function createHeading(level) {
  const Heading = ({ children }) => {
    let slug = slugify(children);
    return React.createElement(
      `h${level}`,
      // A post's h2 holds a "listen" button: keep the heading's name its text
      { id: slug, "aria-label": level === 2 && typeof children === "string" ? children : undefined },
      [
        React.createElement("a", {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: "anchor",
        }),
      ],
      children,
      // Shown while a post's section title is stuck (see .post h2)
      level === 2 ? React.createElement(SectionSubheading, { key: "subheading" }) : null
    );
  };

  Heading.displayName = `Heading${level}`;

  return Heading;
}

let components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink,
  code: Code,
  pre: CodeBlock,
  Tabs,
  Tab,
  Table: MdxTable,
};

// Wraps each h2 and what follows it in a <section>, so a sticky section
// title only stays until its own section ends
function rehypeSections() {
  return (tree) => {
    const children: unknown[] = [];
    let section: { type: string; tagName: string; properties: object; children: unknown[] } | null =
      null;
    for (const node of tree.children) {
      if (node.type === "element" && node.tagName === "h2") {
        section = { type: "element", tagName: "section", properties: {}, children: [node] };
        children.push(section);
      } else if (section && node.type !== "mdxjsEsm") {
        section.children.push(node);
      } else {
        children.push(node);
      }
    }
    tree.children = children;
  };
}

export function CustomMDX(props) {
  return (
    <MDXRemote
      {...props}
      // v6 strips JS expressions (e.g. width={576}); posts are trusted files
      options={{
        blockJS: false,
        ...props.options,
        mdxOptions: {
          ...props.options?.mdxOptions,
          rehypePlugins: [rehypeSections, ...(props.options?.mdxOptions?.rehypePlugins ?? [])],
        },
      }}
      components={{ ...components, ...(props.components || {}) }}
    />
  );
}
