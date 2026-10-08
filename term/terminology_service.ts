/// <reference lib="deno.ns" />

/**
 * OpenEHR Terminology Service Implementation
 *
 * This module provides access to openEHR's internal terminologies and code sets
 * loaded from the official XML files.
 */

export interface TermCode {
  code: string;
  description?: string;
  rubric?: string;
}

export interface CodeSet {
  issuer: string;
  openehr_id: string;
  name: string;
  external_id: string;
  codes: TermCode[];
}

export interface TerminologyGroup {
  openehr_id: string;
  name: string;
  concepts: Map<string, string>; // id -> rubric
}

export interface Terminology {
  name: string;
  language: string;
  version: string;
  date: string;
  codeSets: Map<string, CodeSet>;
  groups: Map<string, TerminologyGroup>;
}

/**
 * Singleton class providing access to openEHR terminologies
 */
export class OpenEHRTerminologyService {
  private static instance: OpenEHRTerminologyService;
  private terminologies: Map<string, Terminology> = new Map();
  private externalTerminology?: Terminology;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): OpenEHRTerminologyService {
    if (!OpenEHRTerminologyService.instance) {
      OpenEHRTerminologyService.instance = new OpenEHRTerminologyService();
    }
    return OpenEHRTerminologyService.instance;
  }

  /**
   * Initialize the terminology service by loading XML files
   */
  public async initialize(): Promise<void> {
    const languages = ["en", "es", "pt"];

    for (const lang of languages) {
      try {
        const xml = await Deno.readTextFile(
          `terminology_data/openehr_terminology_${lang}.xml`,
        );
        const terminology = this.parseTerminologyXml(xml);
        this.terminologies.set(lang, terminology);
      } catch (error) {
        console.warn(`Failed to load terminology for language ${lang}:`, error);
      }
    }

    // Load external terminologies
    try {
      const xml = await Deno.readTextFile(
        "terminology_data/openehr_external_terminologies.xml",
      );
      this.externalTerminology = this.parseTerminologyXml(xml);
    } catch (error) {
      console.warn("Failed to load external terminologies:", error);
    }
  }

  /**
   * Parse official openEHR terminology XML.
   *
   * The documents only contain `terminology`, `codeset`/`code`, and
   * `group`/`concept` elements, and callers only read attributes. A small
   * reader keeps a CSS selector engine out of reference-model bundles.
   */
  private parseTerminologyXml(xmlContent: string): Terminology {
    const rootMatch = xmlContent.match(/<terminology\b([^>]*)>/);
    if (!rootMatch) {
      throw new Error("No terminology element found in XML");
    }
    const rootAttrs = readXmlAttributes(rootMatch[1]);

    const terminology: Terminology = {
      name: rootAttrs.get("name") || "",
      language: rootAttrs.get("language") || "",
      version: rootAttrs.get("version") || "",
      date: rootAttrs.get("date") || "",
      codeSets: new Map(),
      groups: new Map(),
    };

    const codeSetRe = /<codeset\b([^>]*)>([\s\S]*?)<\/codeset>/g;
    for (const codeSetMatch of xmlContent.matchAll(codeSetRe)) {
      const codeSetAttrs = readXmlAttributes(codeSetMatch[1]);
      const codeSet: CodeSet = {
        issuer: codeSetAttrs.get("issuer") || "",
        openehr_id: codeSetAttrs.get("openehr_id") || "",
        name: codeSetAttrs.get("name") || "",
        external_id: codeSetAttrs.get("external_id") || "",
        codes: [],
      };

      const codeRe = /<code\b([^>]*?)\/?>/g;
      for (const codeMatch of codeSetMatch[2].matchAll(codeRe)) {
        const codeAttrs = readXmlAttributes(codeMatch[1]);
        codeSet.codes.push({
          code: codeAttrs.get("value") || "",
          description: codeAttrs.get("description") || undefined,
        });
      }

      terminology.codeSets.set(codeSet.openehr_id, codeSet);
    }

    const groupRe = /<group\b([^>]*)>([\s\S]*?)<\/group>/g;
    for (const groupMatch of xmlContent.matchAll(groupRe)) {
      const groupAttrs = readXmlAttributes(groupMatch[1]);
      const group: TerminologyGroup = {
        openehr_id: groupAttrs.get("openehr_id") || "",
        name: groupAttrs.get("name") || "",
        concepts: new Map(),
      };

      const conceptRe = /<concept\b([^>]*?)\/?>/g;
      for (const conceptMatch of groupMatch[2].matchAll(conceptRe)) {
        const conceptAttrs = readXmlAttributes(conceptMatch[1]);
        const id = conceptAttrs.get("id") || "";
        const rubric = conceptAttrs.get("rubric") || "";
        group.concepts.set(id, rubric);
      }

      terminology.groups.set(group.openehr_id, group);
    }

    return terminology;
  }

  /**
   * Get terminology by name (currently only "openehr" is supported)
   */
  public hasTerminology(name: string): boolean {
    return name.toLowerCase() === "openehr";
  }

  /**
   * Get code set by openEHR internal ID
   */
  public getCodeSet(id: string, language: string = "en"): CodeSet | undefined {
    const terminology = this.terminologies.get(language);
    const fromLanguage = terminology?.codeSets.get(id);
    if (fromLanguage) {
      return fromLanguage;
    }

    // External code sets (countries, languages, …) are not in the language files.
    return this.externalTerminology?.codeSets.get(id);
  }

  /**
   * Check if a code set exists
   */
  public hasCodeSet(id: string): boolean {
    // Check all loaded terminologies
    for (const terminology of this.terminologies.values()) {
      if (terminology.codeSets.has(id)) {
        return true;
      }
    }

    if (this.externalTerminology && this.externalTerminology.codeSets.has(id)) {
      return true;
    }

    return false;
  }

  /**
   * Get terminology group
   */
  public getGroup(
    groupId: string,
    language: string = "en",
  ): TerminologyGroup | undefined {
    const terminology = this.terminologies.get(language);
    return terminology?.groups.get(groupId);
  }

  /**
   * Check if a terminology group exists
   */
  public hasGroup(groupId: string): boolean {
    for (const terminology of this.terminologies.values()) {
      if (terminology.groups.has(groupId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all code set identifiers
   */
  public getCodeSetIdentifiers(): string[] {
    const identifiers = new Set<string>();

    for (const terminology of this.terminologies.values()) {
      for (const id of terminology.codeSets.keys()) {
        identifiers.add(id);
      }
    }

    if (this.externalTerminology) {
      for (const id of this.externalTerminology.codeSets.keys()) {
        identifiers.add(id);
      }
    }

    return Array.from(identifiers);
  }

  /**
   * Get all terminology group identifiers
   */
  public getGroupIdentifiers(): string[] {
    const identifiers = new Set<string>();

    for (const terminology of this.terminologies.values()) {
      for (const id of terminology.groups.keys()) {
        identifiers.add(id);
      }
    }

    return Array.from(identifiers);
  }

  /**
   * Get all codes from a code set
   */
  public getAllCodes(codeSetId: string, language: string = "en"): string[] {
    const codeSet = this.getCodeSet(codeSetId, language);
    return codeSet ? codeSet.codes.map((c) => c.code) : [];
  }

  /**
   * Get concept rubric from group
   */
  public getConceptRubric(
    groupId: string,
    conceptId: string,
    language: string = "en",
  ): string | undefined {
    const group = this.getGroup(groupId, language);
    return group?.concepts.get(conceptId);
  }

  /**
   * Get all codes for a specific terminology group
   */
  public getCodesForGroup(groupId: string, language: string = "en"): string[] {
    const group = this.getGroup(groupId, language);
    if (!group) {
      return [];
    }
    return Array.from(group.concepts.keys());
  }

  /**
   * Get group ID by name in a specific language
   */
  public getGroupIdByName(
    name: string,
    language: string = "en",
  ): string | undefined {
    const terminology = this.terminologies.get(language);
    if (!terminology) {
      return undefined;
    }

    // Search for group by name (case-insensitive)
    const normalizedName = name.toLowerCase();
    for (const [id, group] of terminology.groups) {
      if (group.name.toLowerCase() === normalizedName) {
        return id;
      }
    }

    return undefined;
  }

  /**
   * Get rubric (human-readable term) for a specific code
   * Searches across all groups to find the rubric
   */
  public getRubricForCode(
    code: string,
    language: string = "en",
  ): string | undefined {
    const terminology = this.terminologies.get(language);
    if (!terminology) {
      return undefined;
    }

    // Search all groups for the code
    for (const group of terminology.groups.values()) {
      const rubric = group.concepts.get(code);
      if (rubric) {
        return rubric;
      }
    }

    // Also check code sets
    for (const codeSet of terminology.codeSets.values()) {
      const codeEntry = codeSet.codes.find((c) => c.code === code);
      if (codeEntry?.description) {
        return codeEntry.description;
      }
    }

    return undefined;
  }
}

/** Decode the entities used in the official terminology XML files. */
function decodeXmlEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-fA-F]+|#\d+|lt|gt|quot|apos|amp);/g,
    (entity) => {
      switch (entity) {
        case "&lt;":
          return "<";
        case "&gt;":
          return ">";
        case "&quot;":
          return '"';
        case "&apos;":
          return "'";
        case "&amp;":
          return "&";
        default: {
          const hex = entity.match(/^&#x([0-9a-fA-F]+);$/);
          if (hex) return String.fromCodePoint(parseInt(hex[1], 16));
          const dec = entity.match(/^&#(\d+);$/);
          if (dec) return String.fromCodePoint(parseInt(dec[1], 10));
          return entity;
        }
      }
    },
  );
}

/** Read double-quoted attributes from the inside of an opening tag. */
function readXmlAttributes(attrText: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const attrRe = /([A-Za-z_][\w:.-]*)\s*=\s*"([^"]*)"/g;
  for (const match of attrText.matchAll(attrRe)) {
    attrs.set(match[1], decodeXmlEntities(match[2]));
  }
  return attrs;
}
