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
  },

  'realistic-composition': {
    name: 'Realistic Template Composition',
    description: 'Real-world example (ChemoForm-MBA) with Clusters and Observations',
    json: `{
  "_type": "COMPOSITION",
  "name": {
    "_type": "DV_TEXT",
    "value": "ChemoForm-MBA.v7"
  },
  "uid": {
    "_type": "OBJECT_VERSION_ID",
    "value": "573b2f9c-d267-4052-ae09-7b58dcfd6233::regionstockholm_se::1"
  },
  "archetype_details": {
    "_type": "ARCHETYPED",
    "archetype_id": {
      "_type": "ARCHETYPE_ID",
      "value": "openEHR-EHR-COMPOSITION.self_reported_data.v1"
    },
    "template_id": {
      "_type": "TEMPLATE_ID",
      "value": "ChemoForm-MBA.v7"
    },
    "rm_version": "1.1.0"
  },
  "feeder_audit": {
    "_type": "FEEDER_AUDIT",
    "original_content": {
      "_type": "DV_PARSABLE",
      "value": "{}",
      "formalism": "application/json"
    },
    "originating_system_audit": {
      "_type": "FEEDER_AUDIT_DETAILS",
      "system_id": "FormRenderer"
    }
  },
  "archetype_node_id": "openEHR-EHR-COMPOSITION.self_reported_data.v1",
  "language": {
    "_type": "CODE_PHRASE",
    "terminology_id": {
      "_type": "TERMINOLOGY_ID",
      "value": "ISO_639-1"
    },
    "code_string": "sv"
  },
  "territory": {
    "_type": "CODE_PHRASE",
    "terminology_id": {
      "_type": "TERMINOLOGY_ID",
      "value": "ISO_3166-1"
    },
    "code_string": "SI"
  },
  "category": {
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
  },
  "composer": {
    "_type": "PARTY_IDENTIFIED",
    "name": "erik.sundvall@regionstockholm.se"
  },
  "context": {
    "_type": "EVENT_CONTEXT",
    "start_time": {
      "_type": "DV_DATE_TIME",
      "value": "2023-08-31T18:31:16.004+02:00"
    },
    "setting": {
      "_type": "DV_CODED_TEXT",
      "value": "other care",
      "defining_code": {
        "_type": "CODE_PHRASE",
        "terminology_id": {
          "_type": "TERMINOLOGY_ID",
          "value": "openehr"
        },
        "code_string": "238"
      }
    },
    "other_context": {
      "_type": "ITEM_TREE",
      "name": {
        "_type": "DV_TEXT",
        "value": "Item tree"
      },
      "archetype_node_id": "at0003",
      "items": [
        {
          "_type": "CLUSTER",
          "name": {
            "_type": "DV_TEXT",
            "value": "Vårdenhet"
          },
          "archetype_details": {
            "_type": "ARCHETYPED",
            "archetype_id": {
              "_type": "ARCHETYPE_ID",
              "value": "openEHR-EHR-CLUSTER.organisation.v1"
            },
            "rm_version": "1.1.0"
          },
          "archetype_node_id": "openEHR-EHR-CLUSTER.organisation.v1",
          "items": [
            {
              "_type": "ELEMENT",
              "name": {
                "_type": "DV_TEXT",
                "value": "Namn"
              },
              "archetype_node_id": "at0001",
              "value": {
                "_type": "DV_TEXT",
                "value": "Brandbergens vårdcentral"
              }
            },
            {
              "_type": "ELEMENT",
              "name": {
                "_type": "DV_TEXT",
                "value": "Identifierare"
              },
              "archetype_node_id": "at0003",
              "value": {
                "_type": "DV_IDENTIFIER",
                "id": "SE2321000016-1003",
                "type": "urn:oid:1.2.752.29.4.19"
              }
            },
            {
              "_type": "ELEMENT",
              "name": {
                "_type": "DV_TEXT",
                "value": "Roll"
              },
              "archetype_node_id": "at0004",
              "value": {
                "_type": "DV_CODED_TEXT",
                "value": "vårdenhet",
                "defining_code": {
                  "_type": "CODE_PHRASE",
                  "terminology_id": {
                    "_type": "TERMINOLOGY_ID",
                    "value": "http://snomed.info/sct/900000000000207008"
                  },
                  "code_string": "43741000"
                }
              }
            },
            {
              "_type": "CLUSTER",
              "name": {
                "_type": "DV_TEXT",
                "value": "Vårdgivare"
              },
              "archetype_details": {
                "_type": "ARCHETYPED",
                "archetype_id": {
                  "_type": "ARCHETYPE_ID",
                  "value": "openEHR-EHR-CLUSTER.organisation.v1"
                },
                "rm_version": "1.1.0"
              },
              "archetype_node_id": "openEHR-EHR-CLUSTER.organisation.v1",
              "items": [
                {
                  "_type": "ELEMENT",
                  "name": {
                    "_type": "DV_TEXT",
                    "value": "Namn"
                  },
                  "archetype_node_id": "at0001",
                  "value": {
                    "_type": "DV_TEXT",
                    "value": "Stockholms läns sjukvårdsområde"
                  }
                },
                {
                  "_type": "ELEMENT",
                  "name": {
                    "_type": "DV_TEXT",
                    "value": "Identifierare"
                  },
                  "archetype_node_id": "at0003",
                  "value": {
                    "_type": "DV_IDENTIFIER",
                    "id": "SE2321000016-2GJS",
                    "type": "urn:oid:1.2.752.29.4.19"
                  }
                },
                {
                  "_type": "ELEMENT",
                  "name": {
                    "_type": "DV_TEXT",
                    "value": "Organisationsnummer"
                  },
                  "archetype_node_id": "at0003",
                  "value": {
                    "_type": "DV_IDENTIFIER",
                    "id": "2232084",
                    "type": "urn:oid:2.5.4.97"
                  }
                },
                {
                  "_type": "ELEMENT",
                  "name": {
                    "_type": "DV_TEXT",
                    "value": "Roll"
                  },
                  "archetype_node_id": "at0004",
                  "value": {
                    "_type": "DV_CODED_TEXT",
                    "value": "vårdgivare",
                    "defining_code": {
                      "_type": "CODE_PHRASE",
                      "terminology_id": {
                        "_type": "TERMINOLOGY_ID",
                        "value": "http://snomed.info/sct/45991000052106"
                      },
                      "code_string": "143591000052106"
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },
  "content": [
    {
      "_type": "OBSERVATION",
      "name": {
        "_type": "DV_TEXT",
        "value": "Frågeformulär för symptom och andra tecken"
      },
      "archetype_details": {
        "_type": "ARCHETYPED",
        "archetype_id": {
          "_type": "ARCHETYPE_ID",
          "value": "openEHR-EHR-OBSERVATION.symptom_sign_screening.v1"
        },
        "rm_version": "1.1.0"
      },
      "archetype_node_id": "openEHR-EHR-OBSERVATION.symptom_sign_screening.v1",
      "language": {
        "_type": "CODE_PHRASE",
        "terminology_id": {
          "_type": "TERMINOLOGY_ID",
          "value": "ISO_639-1"
        },
        "code_string": "sv"
      },
      "encoding": {
        "_type": "CODE_PHRASE",
        "terminology_id": {
          "_type": "TERMINOLOGY_ID",
          "value": "IANA_character-sets"
        },
        "code_string": "UTF-8"
      },
      "subject": {
        "_type": "PARTY_SELF"
      },
      "data": {
        "_type": "HISTORY",
        "name": {
          "_type": "DV_TEXT",
          "value": "History"
        },
        "archetype_node_id": "at0001",
        "origin": {
          "_type": "DV_DATE_TIME",
          "value": "2023-08-31T18:31:16.004+02:00"
        },
        "events": [
          {
            "_type": "POINT_EVENT",
            "name": {
              "_type": "DV_TEXT",
              "value": "Ospecificerad händelse"
            },
            "archetype_node_id": "at0002",
            "time": {
              "_type": "DV_DATE_TIME",
              "value": "2023-08-31T18:31:16.004+02:00"
            },
            "data": {
              "_type": "ITEM_TREE",
              "name": {
                "_type": "DV_TEXT",
                "value": "Tree"
              },
              "archetype_node_id": "at0003",
              "items": [
                {
                  "_type": "ELEMENT",
                  "name": {
                    "_type": "DV_TEXT",
                    "value": "Screeningssyfte"
                  },
                  "archetype_node_id": "at0034",
                  "value": {
                    "_type": "DV_CODED_TEXT",
                    "value": "utvärdering av cytostatikabehandling",
                    "defining_code": {
                      "_type": "CODE_PHRASE",
                      "terminology_id": {
                        "_type": "TERMINOLOGY_ID",
                        "value": "SNOMED-CT"
                      },
                      "code_string": "385785003"
                    }
                  }
                },
                {
                  "_type": "CLUSTER",
                  "name": {
                    "_type": "DV_TEXT",
                    "value": "Trötthet"
                  },
                  "archetype_details": {
                    "_type": "ARCHETYPED",
                    "archetype_id": {
                      "_type": "ARCHETYPE_ID",
                      "value": "openEHR-EHR-CLUSTER.specific_symptom_sign_question.v0"
                    },
                    "rm_version": "1.1.0"
                  },
                  "archetype_node_id": "openEHR-EHR-CLUSTER.specific_symptom_sign_question.v0",
                  "items": [
                    {
                      "_type": "ELEMENT",
                      "name": {
                        "_type": "DV_TEXT",
                        "value": "Symptom/tecken-benämning"
                      },
                      "archetype_node_id": "at0004",
                      "value": {
                        "_type": "DV_CODED_TEXT",
                        "value": "trötthet (fatigue)",
                        "defining_code": {
                          "_type": "CODE_PHRASE",
                          "terminology_id": {
                            "_type": "TERMINOLOGY_ID",
                            "value": "SNOMED-CT"
                          },
                          "code_string": "84229001"
                        }
                      }
                    },
                    {
                      "_type": "ELEMENT",
                      "name": {
                        "_type": "DV_TEXT",
                        "value": "Upplever du trötthet (fatigue) som påverkar ditt dagliga liv?"
                      },
                      "archetype_node_id": "at0005",
                      "value": {
                        "_type": "DV_CODED_TEXT",
                        "value": "Ja",
                        "defining_code": {
                          "_type": "CODE_PHRASE",
                          "terminology_id": {
                            "_type": "TERMINOLOGY_ID",
                            "value": "local"
                          },
                          "code_string": "at0023"
                        }
                      }
                    },
                    {
                      "_type": "CLUSTER",
                      "name": {
                        "_type": "DV_TEXT",
                        "value": "följdfråga"
                      },
                      "archetype_details": {
                        "_type": "ARCHETYPED",
                        "archetype_id": {
                          "_type": "ARCHETYPE_ID",
                          "value": "openEHR-EHR-CLUSTER.followup_question.v0"
                        },
                        "rm_version": "1.1.0"
                      },
                      "archetype_node_id": "openEHR-EHR-CLUSTER.followup_question.v0",
                      "items": [
                        {
                          "_type": "ELEMENT",
                          "name": {
                            "_type": "DV_TEXT",
                            "value": "Hur påverkar tröttheten ditt dagliga liv?"
                          },
                          "archetype_node_id": "at0002",
                          "value": {
                            "_type": "DV_ORDINAL",
                            "value": 2,
                            "symbol": {
                              "_type": "DV_CODED_TEXT",
                              "value": "Måttlig trötthet, vilar mindre än 50% av vaken tid",
                              "defining_code": {
                                "_type": "CODE_PHRASE",
                                "terminology_id": {
                                  "_type": "TERMINOLOGY_ID",
                                  "value": "local"
                                },
                                "code_string": "at0.17"
                              }
                            }
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    }
  ]
}`
  },
};
