# ehrtslib Format Converter - Mockup

This directory contains the **static HTML/CSS mockup** for the ehrtslib Format Converter demo application. This is a visual prototype created in Phase 4g.5, Section 0, before full implementation.

## 🎯 Purpose

This mockup serves as a design reference and stakeholder review tool before proceeding with the full TypeScript implementation. It demonstrates:

- Complete UI/UX design
- Layout and responsive behavior
- Visual styling and color scheme
- All interactive elements (non-functional)
- Example data presentation

## 👀 How to View the Mockup

### Method 1: Direct File Opening (Simplest)
1. Navigate to this directory: `examples/demo-app/mockup/`
2. Double-click `index.html` to open it in your default browser
3. Alternatively, right-click `index.html` → "Open with" → Choose your browser

### Method 2: Local Web Server (Recommended for Development)
If you have Python installed:
```bash
# Navigate to the mockup directory
cd examples/demo-app/mockup/

# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

Or with Deno:
```bash
deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts
```

### Method 3: VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## 🎨 Design Decisions

### Layout Structure
- **Three-panel layout**: Input (left) | Options (center) | Output (right)
- **Grid-based responsive design**: Stacks vertically on tablets and mobile devices
- **Fixed header and footer**: For consistent branding and navigation

### Color Scheme
- **Primary color**: Blue (#2563eb) - Professional, trustworthy, tech-focused
- **Background**: Light gray (#f8fafc) - Reduces eye strain, modern look
- **Code areas**: Dark background (#1e293b) - Better for code readability
- **Accent colors**: Green (success), red (errors), yellow (warnings)

### Typography
- **Sans-serif font**: System fonts for fast loading and native feel
- **Monospace font**: For all code and output areas
- **Hierarchical sizing**: Clear visual hierarchy from headers to body text

### Interactive Elements
- **Large convert button**: Primary action is prominent and centered
- **Tab-based output**: Easy switching between formats
- **Dropdown menu for examples**: Saves space while providing quick access
- **Tooltips**: Contextual help without cluttering the interface

### Responsive Breakpoints
- **Desktop** (> 1200px): Three-column layout
- **Tablet** (768px - 1200px): Single-column stacked layout
- **Mobile** (< 768px): Optimized for touch, larger buttons, simplified toolbar

### Accessibility Features
- **WCAG AA compliant** color contrast ratios
- **Keyboard navigation** support (focus indicators)
- **Screen reader friendly** semantic HTML
- **Reduced motion** support for animations
- **High contrast mode** support

## 📋 What This Mockup Shows

### Input Panel
✅ Format selector dropdown (XML, JSON, YAML)  
✅ Large textarea for input with syntax highlighting background  
✅ Load Example button with dropdown menu (5 examples)  
✅ Upload File button  
✅ Clear button  
✅ Character and line count display  
✅ Validation status indicator  

### Options Panel
✅ Output format checkboxes (XML, JSON, YAML, TypeScript)  
✅ JSON options (pretty print, terse format, hybrid style, type inference)  
✅ YAML options (block/hybrid style, terse format, type inference)  
✅ XML options (pretty print, namespaces)  
✅ TypeScript options (terse format, compact constructors, comments)  
✅ Large Convert button  
✅ Loading state indicator  
✅ Error state display  

### Output Panel
✅ Tabbed interface for multiple outputs  
✅ Four tabs: XML, JSON, YAML, TypeScript  
✅ Copy to Clipboard button per tab  
✅ Download button per tab  
✅ Syntax-highlighted output preview  
✅ Success message after copy operation  

### Header & Footer
✅ Clear branding and description  
✅ Links to documentation and GitHub  
✅ Copyright and licensing information  

## ⚠️ What Is NOT Functional (Yet)

This is a **static mockup** - the following are NOT yet implemented:

❌ Actual conversion logic  
❌ File upload functionality  
❌ Example data loading  
❌ Format validation  
❌ Copy to clipboard  
❌ Download functionality  
❌ Tab switching  
❌ Real-time character counting  
❌ Error handling  
❌ Dynamic option toggling  

All interactive functionality will be implemented in **Sections 1-11** of the task list using TypeScript.

## 🔄 What Happens Next (Implementation Phase)

After stakeholder approval of this mockup, the implementation will proceed with:

1. **Project Setup** (Section 1)
   - Deno build configuration
   - TypeScript module structure
   - Import maps for serialization modules

2. **Application Logic** (Section 3)
   - Deserialization from XML/JSON/YAML
   - Serialization to all formats
   - TypeScript code generation
   - Conversion controller

3. **Integration** (Sections 4-10)
   - Error handling
   - Example data
   - Testing (unit, integration, browser)
   - Documentation
   - Deployment

## 📝 Example Data in Mockup

The mockup demonstrates a **complex COMPOSITION** example with nested structures, based on the YAML serializer documentation. It shows a COMPOSITION containing a SECTION with two sibling ELEMENT items - one with DV_CODED_TEXT (diagnosis) and one with DV_QUANTITY (pulse rate).

**JSON Input:**
```json
{
  "_type": "COMPOSITION",
  "name": {"_type": "DV_TEXT", "value": "Vital Signs Encounter"},
  "archetype_node_id": "openEHR-EHR-COMPOSITION.encounter.v1",
  "language": {"_type": "CODE_PHRASE", "terminology_id": {"_type": "TERMINOLOGY_ID", "value": "ISO_639-1"}, "code_string": "en"},
  "territory": {"_type": "CODE_PHRASE", "terminology_id": {"_type": "TERMINOLOGY_ID", "value": "ISO_3166-1"}, "code_string": "GB"},
  "category": {"_type": "DV_CODED_TEXT", "value": "event", "defining_code": {"_type": "CODE_PHRASE", "terminology_id": {"_type": "TERMINOLOGY_ID", "value": "openehr"}, "code_string": "433"}},
  "composer": {"_type": "PARTY_IDENTIFIED", "name": "Dr. Smith"},
  "content": [{
    "_type": "SECTION",
    "name": {"_type": "DV_TEXT", "value": "Vital Signs"},
    "items": [
      {
        "_type": "ELEMENT",
        "name": {"_type": "DV_TEXT", "value": "Diagnosis"},
        "value": {
          "_type": "DV_CODED_TEXT",
          "value": "Diabetes mellitus type 2",
          "defining_code": {
            "_type": "CODE_PHRASE",
            "terminology_id": {"_type": "TERMINOLOGY_ID", "value": "SNOMED-CT"},
            "code_string": "44054006"
          }
        }
      },
      {
        "_type": "ELEMENT",
        "name": {"_type": "DV_TEXT", "value": "Pulse rate"},
        "value": {"_type": "DV_QUANTITY", "magnitude": 72, "units": "/min"}
      }
    ]
  }]
}
```

**YAML Output (with terse format):**
```yaml
_type: COMPOSITION
name: {value: Vital Signs Encounter}
archetype_node_id: openEHR-EHR-COMPOSITION.encounter.v1
language: ISO_639-1::en
territory: ISO_3166-1::GB
category: openehr::433|event|
composer:
  name: Dr. Smith
content:
  - _type: SECTION
    name: {value: Vital Signs}
    items:
      - _type: ELEMENT
        name: {value: Diagnosis}
        value:
          _type: DV_CODED_TEXT
          value: Diabetes mellitus type 2
          defining_code: SNOMED-CT::44054006
      - _type: ELEMENT
        name: {value: Pulse rate}
        value: {magnitude: 72, units: /min}
```

**TypeScript Output (with terse format and compact constructors):**
```typescript
import { COMPOSITION, SECTION, ELEMENT, DV_CODED_TEXT, DV_QUANTITY } from "./enhanced/openehr_rm.ts";

const composition = new COMPOSITION({
  name: "Vital Signs Encounter",
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  language: "ISO_639-1::en",
  territory: "ISO_3166-1::GB",
  category: "openehr::433|event|",
  composer: { name: "Dr. Smith" },
  content: [
    new SECTION({
      name: "Vital Signs",
      items: [
        new ELEMENT({
          name: "Diagnosis",
          value: new DV_CODED_TEXT({
            value: "Diabetes mellitus type 2",
            defining_code: "SNOMED-CT::44054006"
          })
        }),
        new ELEMENT({
          name: "Pulse rate",
          value: new DV_QUANTITY({
            magnitude: 72,
            units: "/min"
          })
        })
      ]
    })
  ]
});
```

This example demonstrates:
- **COMPOSITION** as the root container
- **SECTION** for organizing related items
- **ELEMENT** items with different data types (DV_CODED_TEXT and DV_QUANTITY)
- **Terse format** for CODE_PHRASE and DV_CODED_TEXT (e.g., "ISO_639-1::en", "SNOMED-CT::44054006")
- **Compact constructors** in TypeScript using object initialization
- **Sibling elements** showing different value types in the same container

## 🎯 Design Goals Achieved

✅ **Clarity**: Clean, uncluttered interface  
✅ **Efficiency**: Minimal clicks to convert formats  
✅ **Flexibility**: Extensive configuration options  
✅ **Accessibility**: WCAG AA compliant  
✅ **Responsiveness**: Works on all screen sizes  
✅ **Modern**: Contemporary design patterns  
✅ **Professional**: Suitable for technical documentation  

## 🔗 Related Documentation

- **Task List**: `/tasks/task-list-phase4g5-demo-app.md`
- **PRD**: `/tasks/prd-phase4g1-serialization-deserialization.md`
- **Creation Guide**: `/SIMPLIFIED-CREATION-GUIDE.md`
- **Main README**: `/README.md`

## 📸 Screenshots

Open `index.html` in a browser to see:
- Full desktop layout (3-column grid)
- Tablet layout (single column, stacked)
- Mobile layout (optimized for touch)

## 💭 Feedback and Review

**Please review this mockup and provide feedback on:**

1. **Layout**: Is the three-panel layout intuitive?
2. **Options**: Are the configuration options clear and well-organized?
3. **Colors**: Is the color scheme professional and accessible?
4. **Responsive**: Does the mobile layout work well?
5. **Missing Elements**: Is there anything missing from the UI?
6. **Improvements**: Any suggestions for improvement?

**Once approved**, implementation will proceed to Section 1 of the task list.

---

**Status**: ✅ Mockup Complete - Awaiting Review  
**Version**: 1.0  
**Created**: 2025-01-12  
**Next Step**: Developer review and approval before implementation
