import { readFile } from "fs/promises";
import type { IRepository } from "./types";
import { writeFile } from "fs/promises";
import { rm } from "fs/promises";
import { minify } from "html-minifier";
import axios from "axios";

const OWNER = "tarcisioandrade";

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0";

axios.defaults.headers.common["User-Agent"] = userAgent;
const gh = axios.create({
  baseURL: "https://api.github.com",
});

const REPLACES_TARGET = {
  PROJECT_INJECT: "<!-- project_inject -->",
};

const REPOSITORIES = [
  "librasoft-client",
  "tfandrade",
  "devjobs",
  "setnfy",
  "wanga",
];

function m(html: TemplateStringsArray, ...args: any[]) {
  const str = html.reduce((s, h, i) => s + h + (args[i] ?? ""), "");
  return minify(str, {
    removeAttributeQuotes: true,
    removeEmptyAttributes: true,
    removeTagWhitespace: true,
    collapseWhitespace: true,
  }).trim();
}

function generateTableProjects(repos: IRepository[]) {
  const tbody = repos.reduce(
    (acc, cur) =>
      acc +
      `<tr>
    <td><a href="${cur.html_url}" target="_blank"><b>
    ${cur.full_name}</b></a> ${
        cur.homepage ? `<a href="${cur.homepage}" target="_blank">🔗</a>` : ""
      }</td>
    <td><img alt="Stars" src="https://img.shields.io/github/stars/${
      cur.full_name
    }?style=flat-square&labelColor=343b41"/></td>
    <td>${new Date(cur.created_at).toLocaleDateString("pt-BR")}</td>
    <td>${new Date(cur.pushed_at).toLocaleDateString("pt-BR")}</td>
  </tr>`,
    ``
  );

  return m`<table>
<thead align="center">
<tr border: none;>
<td><b>🎁 Projetos</b></td>
<td><b>⭐ Estrelas</b></td>
<td><b>🕐 Criado Em</b></td>
<td><b>📅 Ultíma Atividade Em</b></td>
</tr>
</thead>
<tbody>
${tbody}
</tbody>
</table>`;
}

(async function main() {
  const template = await readFile("./readme.template.md", {
    encoding: "utf-8",
  });

  const mainProjects: IRepository[] = await Promise.all(
    REPOSITORIES.map((repo) =>
      gh.get(`/repos/${OWNER}/${repo}`).then((o) => o.data)
    )
  );

  const projectsHTML = generateTableProjects(mainProjects);

  const newContent = template.replace(
    REPLACES_TARGET.PROJECT_INJECT,
    projectsHTML
  );

  await rm("./README.md", { force: true });
  await writeFile("./README.md", newContent, { encoding: "utf-8" });
})();
