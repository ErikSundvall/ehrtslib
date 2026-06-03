/**
 * Compact D3 collapsible tree for constraint definition nodes.
 */

import * as d3 from "d3";
import type { DefinitionTreeNode } from "../../../enhanced/parser/clinical_model_annotations.ts";

export interface TreeViewOptions {
  container: HTMLElement;
  onSelect: (node: DefinitionTreeNode) => void;
  selectedPath?: string;
}

interface HierarchyDatum extends d3.HierarchyPointNode<DefinitionTreeNode> {
  _children?: HierarchyDatum[];
}

const NODE_W = 14;
const NODE_H = 20;

export class DefinitionTreeView {
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private root!: HierarchyDatum;
  private options: TreeViewOptions;
  private width = 400;
  private height = 400;

  constructor(options: TreeViewOptions) {
    this.options = options;
    this.svg = d3
      .select(options.container)
      .append("svg")
      .attr("class", "definition-tree-svg");
    this.g = this.svg.append("g").attr("transform", "translate(8,12)");
  }

  resize(): void {
    const rect = this.options.container.getBoundingClientRect();
    this.width = Math.max(200, rect.width - 16);
    this.height = Math.max(200, rect.height - 24);
    this.svg.attr("width", this.width).attr("height", this.height);
    if (this.root) this.render();
  }

  setData(tree: DefinitionTreeNode | undefined): void {
    if (!tree) {
      this.options.container.querySelector(".tree-empty")?.remove();
      const msg = document.createElement("p");
      msg.className = "tree-empty";
      msg.textContent = "No definition tree (empty or unparsed model).";
      this.options.container.appendChild(msg);
      this.svg.style("display", "none");
      return;
    }
    this.options.container.querySelector(".tree-empty")?.remove();
    this.svg.style("display", null);

    const hierarchy = d3.hierarchy(tree, (d) => d.children);
    hierarchy.x0 = 0;
    hierarchy.y0 = 0;
    this.root = hierarchy as HierarchyDatum;
    this.root.x0 = this.height / 2;
    this.root.y0 = 0;
    if (this.root.children) {
      this.root.children.forEach((c) => this.collapse(c as HierarchyDatum));
    }
    this.resize();
  }

  private collapse(d: HierarchyDatum): void {
    if (d.children) {
      d._children = d.children as HierarchyDatum[];
      d._children.forEach((c) => this.collapse(c));
      d.children = undefined;
    }
  }

  private click(event: Event, d: HierarchyDatum): void {
    if (d.children) {
      d._children = d.children as HierarchyDatum[];
      d.children = undefined;
    } else if (d._children) {
      d.children = d._children;
      d._children = undefined;
    }
    this.options.onSelect(d.data);
    this.render();
    event.stopPropagation();
  }

  private render(): void {
    const duration = 200;
    const treeLayout = d3.tree<DefinitionTreeNode>().size([
      this.height - 40,
      this.width - 120,
    ]);

    const root = this.root;
    treeLayout(root);

    const nodes = root.descendants() as HierarchyDatum[];
    const links = root.links();

    const node = this.g.selectAll<SVGGElement, HierarchyDatum>("g.node")
      .data(nodes, (d) => d.data.id);

    const nodeEnter = node.enter()
      .append("g")
      .attr("class", (d) => {
        const classes = ["node"];
        if (d.data.hasAnnotations) classes.push("has-annotations");
        if (d.data.path === this.options.selectedPath) classes.push("selected");
        return classes.join(" ");
      })
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .on("click", (event, d) => this.click(event, d));

    nodeEnter.append("circle")
      .attr("r", 4)
      .attr("class", (d) => d.data.hasAnnotations ? "annotated" : "");

    nodeEnter.append("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => (d.children || d._children ? -8 : 8))
      .attr("text-anchor", (d) => (d.children || d._children ? "end" : "start"))
      .text((d) => {
        const suffix = d.data.annotationKeyCount > 0
          ? ` (${d.data.annotationKeyCount})`
          : "";
        const short = d.data.label.length > 36
          ? d.data.label.slice(0, 34) + "…"
          : d.data.label;
        return short + suffix;
      });

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate
      .attr("class", (d) => {
        const classes = ["node"];
        if (d.data.hasAnnotations) classes.push("has-annotations");
        if (d.data.path === this.options.selectedPath) classes.push("selected");
        return classes.join(" ");
      })
      .transition()
      .duration(duration)
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    node.exit().remove();

    const link = this.g.selectAll<SVGPathElement, d3.HierarchyPointLink<DefinitionTreeNode>>("path.link")
      .data(links, (d) => d.target.data.id);

    const linkEnter = link.enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("d", () => {
        const o = { x: root.x0, y: root.y0 };
        return this.diagonal(o, o);
      });

    linkEnter.merge(link)
      .transition()
      .duration(duration)
      .attr("d", (d) => this.diagonal(d.source, d.target));

    link.exit().remove();
  }

  setSelectedPath(path: string | undefined): void {
    this.options.selectedPath = path;
    if (this.root) this.render();
  }

  private diagonal(
    s: { x: number; y: number },
    d: { x: number; y: number },
  ): string {
    return `M ${s.y} ${s.x}
      C ${(s.y + d.y) / 2} ${s.x},
        ${(s.y + d.y) / 2} ${d.x},
        ${d.y} ${d.x}`;
  }
}
