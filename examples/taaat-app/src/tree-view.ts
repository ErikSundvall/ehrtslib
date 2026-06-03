/**
 * Compact D3 collapsible tree for constraint definition nodes.
 */

import * as d3 from "d3";
import {
  applyTreeLabelMode,
  type DefinitionTreeNode,
} from "../../../enhanced/parser/clinical_model_annotations.ts";
import type { TreeLabelMode } from "../../../enhanced/parser/archetype_terminology.ts";

export interface TreeViewOptions {
  container: HTMLElement;
  onSelect: (node: DefinitionTreeNode) => void;
  selectedPath?: string;
  labelMode?: TreeLabelMode;
}

interface HierarchyDatum extends d3.HierarchyPointNode<DefinitionTreeNode> {
  _children?: HierarchyDatum[];
}

/** Vertical gap between rows, horizontal gap per depth level. */
const NODE_SIZE: [number, number] = [10, 42];
const MARGIN = { top: 4, right: 8, bottom: 4, left: 4 };
const LABEL_MAX_CHARS = 28;
const CIRCLE_R = 2.5;

/**
 * Truncate long labels keeping the distinctive end (e.g. `…items[id3]`).
 */
export function truncateLabelEnd(label: string, maxLen: number): string {
  if (maxLen < 4 || label.length <= maxLen) return label;
  return "\u2026" + label.slice(-(maxLen - 1));
}

export function formatNodeLabel(
  label: string,
  annotationKeyCount: number,
  maxLen = LABEL_MAX_CHARS,
): string {
  const suffix = annotationKeyCount > 0 ? ` (${annotationKeyCount})` : "";
  const room = Math.max(4, maxLen - suffix.length);
  return truncateLabelEnd(label, room) + suffix;
}

export class DefinitionTreeView {
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private root!: HierarchyDatum;
  private options: TreeViewOptions;
  private labelMode: TreeLabelMode;
  private viewWidth = 400;
  private viewHeight = 400;

  constructor(options: TreeViewOptions) {
    this.options = options;
    this.labelMode = options.labelMode ?? "term";
    this.svg = d3
      .select(options.container)
      .append("svg")
      .attr("class", "definition-tree-svg");
    this.g = this.svg.append("g");
  }

  resize(): void {
    const rect = this.options.container.getBoundingClientRect();
    this.viewWidth = Math.max(200, rect.width);
    this.viewHeight = Math.max(200, rect.height);
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
    this.root = hierarchy as HierarchyDatum;
    this.root.x0 = 0;
    this.root.y0 = 0;
    // Show first two levels expanded; deeper levels start collapsed for density.
    if (this.root.children) {
      this.root.children.forEach((c) => {
        this.collapseBelowDepth(c as HierarchyDatum, 1);
      });
    }
    this.resize();
  }

  private collapseBelowDepth(d: HierarchyDatum, depth: number): void {
    if (!d.children) return;
    if (depth <= 0) {
      d._children = d.children as HierarchyDatum[];
      d._children.forEach((c) => this.collapseBelowDepth(c, 0));
      d.children = undefined;
      return;
    }
    d.children.forEach((c) => this.collapseBelowDepth(c as HierarchyDatum, depth - 1));
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
    const duration = 150;
    const treeLayout = d3.tree<DefinitionTreeNode>().nodeSize(NODE_SIZE);

    const root = this.root;
    treeLayout(root);

    const nodes = root.descendants() as HierarchyDatum[];
    const links = root.links();

    const x0 = d3.min(nodes, (d) => d.x) ?? 0;
    const x1 = d3.max(nodes, (d) => d.x) ?? 0;
    const y1 = d3.max(nodes, (d) => d.y) ?? 0;

    const innerHeight = x1 - x0 + NODE_SIZE[0] * 2;
    const innerWidth = y1 + NODE_SIZE[1] + 100;
    const svgWidth = Math.max(this.viewWidth, innerWidth + MARGIN.left + MARGIN.right);
    const svgHeight = Math.max(this.viewHeight, innerHeight + MARGIN.top + MARGIN.bottom);

    this.svg
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    const offsetX = MARGIN.top - x0 + NODE_SIZE[0];
    this.g.attr("transform", `translate(${MARGIN.left},${offsetX})`);

    const node = this.g.selectAll<SVGGElement, HierarchyDatum>("g.node")
      .data(nodes, (d) => d.data.id + (d.depth ?? 0));

    const nodeEnter = node.enter()
      .append("g")
      .attr("class", (d) => this.nodeClass(d))
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .on("click", (event, d) => this.click(event, d));

    nodeEnter.append("circle")
      .attr("r", CIRCLE_R)
      .attr("class", (d) => d.data.hasAnnotations ? "annotated" : "");

    nodeEnter.append("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => (d.children || d._children ? -5 : 5))
      .attr("text-anchor", (d) => (d.children || d._children ? "end" : "start"))
      .text((d) => this.displayLabel(d.data));

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate
      .attr("class", (d) => this.nodeClass(d))
      .transition()
      .duration(duration)
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    nodeUpdate.select("text")
      .text((d) => this.displayLabel(d.data));

    node.exit().remove();

    const link = this.g.selectAll<SVGPathElement, d3.HierarchyPointLink<DefinitionTreeNode>>("path.link")
      .data(links, (d) => d.target.data.id + String(d.target.depth));

    const linkEnter = link.enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("d", () => {
        const o = { x: root.x0 ?? 0, y: root.y0 ?? 0 };
        return this.diagonal(o, o);
      });

    linkEnter.merge(link)
      .transition()
      .duration(duration)
      .attr("d", (d) => this.diagonal(d.source, d.target));

    link.exit().remove();
  }

  private nodeClass(d: HierarchyDatum): string {
    const classes = ["node"];
    if (d.data.hasAnnotations) classes.push("has-annotations");
    if (d.data.path === this.options.selectedPath) classes.push("selected");
    return classes.join(" ");
  }

  setSelectedPath(path: string | undefined): void {
    this.options.selectedPath = path;
    if (this.root) this.render();
  }

  setLabelMode(mode: TreeLabelMode): void {
    this.labelMode = mode;
    if (!this.root) return;
    for (const d of this.root.descendants()) {
      applyTreeLabelMode(d.data, mode);
    }
    this.render();
  }

  private displayLabel(node: DefinitionTreeNode): string {
    return formatNodeLabel(node.label, node.annotationKeyCount);
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
