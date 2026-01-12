/**
 * Example data for the ehrtslib Format Converter demo app
 * 
 * These examples demonstrate different openEHR RM structures in various formats.
 */

export const EXAMPLES = {
  'dv-text': {
    name: 'Simple DV_TEXT',
    description: 'A simple text value',
    json: `{
  "_type": "DV_TEXT",
  "value": "Hello, openEHR!"
}`,
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<DV_TEXT xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <value>Hello, openEHR!</value>
</DV_TEXT>`,
    yaml: `_type: DV_TEXT
value: Hello, openEHR!`
  },
  
  'code-phrase': {
    name: 'CODE_PHRASE',
    description: 'A coded term reference',
    json: `{
  "_type": "CODE_PHRASE",
  "terminology_id": {
    "_type": "TERMINOLOGY_ID",
    "value": "ISO_639-1"
  },
  "code_string": "en"
}`,
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<CODE_PHRASE xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <terminology_id>
    <value>ISO_639-1</value>
  </terminology_id>
  <code_string>en</code_string>
</CODE_PHRASE>`,
    yaml: `_type: CODE_PHRASE
terminology_id:
  _type: TERMINOLOGY_ID
  value: ISO_639-1
code_string: en`
  },
  
  'dv-coded-text': {
    name: 'DV_CODED_TEXT',
    description: 'Text with coded terminology',
    json: `{
  "_type": "DV_CODED_TEXT",
  "value": "event",
  "defining_code": {
    "_type": "CODE_PHRASE",
    "terminology_id": {
      "_type": "TERMINOLOGY_ID",
      "value": "openehr"
    },
    "code_string": "433"
  }
}`,
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<DV_CODED_TEXT xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <value>event</value>
  <defining_code>
    <terminology_id>
      <value>openehr</value>
    </terminology_id>
    <code_string>433</code_string>
  </defining_code>
</DV_CODED_TEXT>`,
    yaml: `_type: DV_CODED_TEXT
value: event
defining_code:
  _type: CODE_PHRASE
  terminology_id:
    _type: TERMINOLOGY_ID
    value: openehr
  code_string: '433'`
  },
  
  'basic-composition': {
    name: 'Basic COMPOSITION',
    description: 'Simple composition structure',
    json: `{
  "_type": "COMPOSITION",
  "name": {"_type": "DV_TEXT", "value": "Vital Signs Encounter"},
  "archetype_node_id": "openEHR-EHR-COMPOSITION.encounter.v1",
  "language": {"_type": "CODE_PHRASE", "terminology_id": {"_type": "TERMINOLOGY_ID", "value": "ISO_639-1"}, "code_string": "en"},
  "territory": {"_type": "CODE_PHRASE", "terminology_id": {"_type": "TERMINOLOGY_ID", "value": "ISO_3166-1"}, "code_string": "GB"},
  "category": {"_type": "DV_CODED_TEXT", "value": "event", "defining_code": {"_type": "CODE_PHRASE", "terminology_id": {"_type": "TERMINOLOGY_ID", "value": "openehr"}, "code_string": "433"}},
  "composer": {"_type": "PARTY_IDENTIFIED", "name": "Dr. Smith"}
}`,
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<COMPOSITION xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <name xsi:type="DV_TEXT">
    <value>Vital Signs Encounter</value>
  </name>
  <archetype_node_id>openEHR-EHR-COMPOSITION.encounter.v1</archetype_node_id>
  <language>
    <terminology_id>
      <value>ISO_639-1</value>
    </terminology_id>
    <code_string>en</code_string>
  </language>
  <territory>
    <terminology_id>
      <value>ISO_3166-1</value>
    </terminology_id>
    <code_string>GB</code_string>
  </territory>
  <category xsi:type="DV_CODED_TEXT">
    <value>event</value>
    <defining_code>
      <terminology_id>
        <value>openehr</value>
      </terminology_id>
      <code_string>433</code_string>
    </defining_code>
  </category>
  <composer xsi:type="PARTY_IDENTIFIED">
    <name>Dr. Smith</name>
  </composer>
</COMPOSITION>`,
    yaml: `_type: COMPOSITION
name:
  _type: DV_TEXT
  value: Vital Signs Encounter
archetype_node_id: openEHR-EHR-COMPOSITION.encounter.v1
language:
  _type: CODE_PHRASE
  terminology_id:
    _type: TERMINOLOGY_ID
    value: ISO_639-1
  code_string: en
territory:
  _type: CODE_PHRASE
  terminology_id:
    _type: TERMINOLOGY_ID
    value: ISO_3166-1
  code_string: GB
category:
  _type: DV_CODED_TEXT
  value: event
  defining_code:
    _type: CODE_PHRASE
    terminology_id:
      _type: TERMINOLOGY_ID
      value: openehr
    code_string: '433'
composer:
  _type: PARTY_IDENTIFIED
  name: Dr. Smith`
  },
  
  'complex-composition': {
    name: 'Complex COMPOSITION',
    description: 'Composition with nested content',
    json: `{
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
}`,
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<COMPOSITION xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <name xsi:type="DV_TEXT">
    <value>Vital Signs Encounter</value>
  </name>
  <archetype_node_id>openEHR-EHR-COMPOSITION.encounter.v1</archetype_node_id>
  <language>
    <terminology_id>
      <value>ISO_639-1</value>
    </terminology_id>
    <code_string>en</code_string>
  </language>
  <territory>
    <terminology_id>
      <value>ISO_3166-1</value>
    </terminology_id>
    <code_string>GB</code_string>
  </territory>
  <category xsi:type="DV_CODED_TEXT">
    <value>event</value>
    <defining_code>
      <terminology_id>
        <value>openehr</value>
      </terminology_id>
      <code_string>433</code_string>
    </defining_code>
  </category>
  <composer xsi:type="PARTY_IDENTIFIED">
    <name>Dr. Smith</name>
  </composer>
  <content xsi:type="SECTION">
    <name xsi:type="DV_TEXT">
      <value>Vital Signs</value>
    </name>
    <items xsi:type="ELEMENT">
      <name xsi:type="DV_TEXT">
        <value>Diagnosis</value>
      </name>
      <value xsi:type="DV_CODED_TEXT">
        <value>Diabetes mellitus type 2</value>
        <defining_code>
          <terminology_id>
            <value>SNOMED-CT</value>
          </terminology_id>
          <code_string>44054006</code_string>
        </defining_code>
      </value>
    </items>
    <items xsi:type="ELEMENT">
      <name xsi:type="DV_TEXT">
        <value>Pulse rate</value>
      </name>
      <value xsi:type="DV_QUANTITY">
        <magnitude>72</magnitude>
        <units>/min</units>
      </value>
    </items>
  </content>
</COMPOSITION>`,
    yaml: `_type: COMPOSITION
name:
  _type: DV_TEXT
  value: Vital Signs Encounter
archetype_node_id: openEHR-EHR-COMPOSITION.encounter.v1
language:
  _type: CODE_PHRASE
  terminology_id:
    _type: TERMINOLOGY_ID
    value: ISO_639-1
  code_string: en
territory:
  _type: CODE_PHRASE
  terminology_id:
    _type: TERMINOLOGY_ID
    value: ISO_3166-1
  code_string: GB
category:
  _type: DV_CODED_TEXT
  value: event
  defining_code:
    _type: CODE_PHRASE
    terminology_id:
      _type: TERMINOLOGY_ID
      value: openehr
    code_string: '433'
composer:
  _type: PARTY_IDENTIFIED
  name: Dr. Smith
content:
  - _type: SECTION
    name:
      _type: DV_TEXT
      value: Vital Signs
    items:
      - _type: ELEMENT
        name:
          _type: DV_TEXT
          value: Diagnosis
        value:
          _type: DV_CODED_TEXT
          value: Diabetes mellitus type 2
          defining_code:
            _type: CODE_PHRASE
            terminology_id:
              _type: TERMINOLOGY_ID
              value: SNOMED-CT
            code_string: '44054006'
      - _type: ELEMENT
        name:
          _type: DV_TEXT
          value: Pulse rate
        value:
          _type: DV_QUANTITY
          magnitude: 72
          units: /min`
  }
};
