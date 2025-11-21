/**
 * OpenEHR Terminology Service Implementation
 * 
 * This module provides access to openEHR's internal terminologies and code sets
 * loaded from the official XML files.
 */

import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

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
    const languages = ['en', 'es', 'pt'];
    
    for (const lang of languages) {
      try {
        const xml = await Deno.readTextFile(`terminology_data/openehr_terminology_${lang}.xml`);
        const terminology = this.parseTerminologyXml(xml);
        this.terminologies.set(lang, terminology);
      } catch (error) {
        console.warn(`Failed to load terminology for language ${lang}:`, error);
      }
    }
    
    // Load external terminologies
    try {
      const xml = await Deno.readTextFile('terminology_data/openehr_external_terminologies.xml');
      this.externalTerminology = this.parseTerminologyXml(xml);
    } catch (error) {
      console.warn('Failed to load external terminologies:', error);
    }
  }
  
  /**
   * Parse terminology XML file
   */
  private parseTerminologyXml(xmlContent: string): Terminology {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, "text/xml");
    
    if (!doc) {
      throw new Error("Failed to parse XML");
    }
    
    const root = doc.querySelector("terminology");
    if (!root) {
      throw new Error("No terminology element found in XML");
    }
    
    const terminology: Terminology = {
      name: root.getAttribute("name") || "",
      language: root.getAttribute("language") || "",
      version: root.getAttribute("version") || "",
      date: root.getAttribute("date") || "",
      codeSets: new Map(),
      groups: new Map(),
    };
    
    // Parse code sets
    const codeSets = Array.from(doc.querySelectorAll("codeset")) as any[];
    for (const codeSetEl of codeSets) {
      const codeSet: CodeSet = {
        issuer: codeSetEl.getAttribute("issuer") || "",
        openehr_id: codeSetEl.getAttribute("openehr_id") || "",
        name: codeSetEl.getAttribute("name") || "",
        external_id: codeSetEl.getAttribute("external_id") || "",
        codes: [],
      };
      
      const codes = Array.from(codeSetEl.querySelectorAll("code")) as any[];
      for (const codeEl of codes) {
        codeSet.codes.push({
          code: codeEl.getAttribute("value") || "",
          description: codeEl.getAttribute("description") || undefined,
        });
      }
      
      terminology.codeSets.set(codeSet.openehr_id, codeSet);
    }
    
    // Parse groups
    const groups = Array.from(doc.querySelectorAll("group")) as any[];
    for (const groupEl of groups) {
      const group: TerminologyGroup = {
        openehr_id: groupEl.getAttribute("openehr_id") || "",
        name: groupEl.getAttribute("name") || "",
        concepts: new Map(),
      };
      
      const concepts = Array.from(groupEl.querySelectorAll("concept")) as any[];
      for (const conceptEl of concepts) {
        const id = conceptEl.getAttribute("id") || "";
        const rubric = conceptEl.getAttribute("rubric") || "";
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
    if (terminology) {
      return terminology.codeSets.get(id);
    }
    
    // Try external terminologies
    if (this.externalTerminology) {
      return this.externalTerminology.codeSets.get(id);
    }
    
    return undefined;
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
  public getGroup(groupId: string, language: string = "en"): TerminologyGroup | undefined {
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
    return codeSet ? codeSet.codes.map(c => c.code) : [];
  }
  
  /**
   * Get concept rubric from group
   */
  public getConceptRubric(groupId: string, conceptId: string, language: string = "en"): string | undefined {
    const group = this.getGroup(groupId, language);
    return group?.concepts.get(conceptId);
  }
}
