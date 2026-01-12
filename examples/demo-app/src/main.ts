/**
 * ehrtslib Format Converter Demo App
 * 
 * Main entry point for the browser application.
 */

import { EXAMPLES } from './examples.js';
import {
  convert,
  initializeTypeRegistry,
  getJsonConfigPreset,
  getJsonDeserializeConfigPreset,
  getYamlConfigPreset,
  getYamlDeserializeConfigPreset,
  type ConversionOptions,
  type InputFormat,
  type OutputFormat,
} from './converter.js';

import type {
  JsonSerializationConfig,
  JsonDeserializationConfig,
} from '../../../enhanced/serialization/json/mod.ts';

import type {
  YamlSerializationConfig,
  YamlDeserializationConfig,
} from '../../../enhanced/serialization/yaml/mod.ts';

// Application state
let currentInputFormat = 'json';
let currentOutputs: any = {};

/**
 * Initialize the application when DOM is loaded
 */
function init() {
  console.log('🚀 ehrtslib Format Converter initialized');
  
  // Initialize TypeRegistry
  try {
    initializeTypeRegistry();
  } catch (error) {
    console.error('Failed to initialize TypeRegistry:', error);
    showError('Failed to initialize application. Please refresh the page.');
    return;
  }
  
  // Set up event listeners
  setupEventListeners();
  
  console.log('✓ Application ready');
}

/**
 * Set up all event listeners for the UI
 */
function setupEventListeners() {
  // Input format selector
  const inputFormatSelect = document.getElementById('input-format') as HTMLSelectElement;
  if (inputFormatSelect) {
    inputFormatSelect.addEventListener('change', handleInputFormatChange);
  }
  
  // Load example button and menu
  const loadExampleBtn = document.getElementById('load-example');
  const exampleMenu = document.getElementById('example-menu');
  if (loadExampleBtn && exampleMenu) {
    loadExampleBtn.addEventListener('click', () => {
      exampleMenu.classList.toggle('hidden');
    });
    
    // Example menu items
    const exampleItems = exampleMenu.querySelectorAll('.example-item');
    exampleItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const exampleKey = (e.target as HTMLElement).getAttribute('data-example');
        if (exampleKey) {
          loadExample(exampleKey);
          exampleMenu.classList.add('hidden');
        }
      });
    });
  }
  
  // Upload file button
  const uploadBtn = document.getElementById('upload-file');
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
  }
  
  // Clear input button
  const clearBtn = document.getElementById('clear-input');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearInput);
  }
  
  // Input textarea
  const inputTextarea = document.getElementById('input-text') as HTMLTextAreaElement;
  if (inputTextarea) {
    inputTextarea.addEventListener('input', handleInputChange);
  }
  
  // Convert button
  const convertBtn = document.getElementById('convert-btn');
  if (convertBtn) {
    convertBtn.addEventListener('click', handleConvert);
  }
  
  // Preset dropdowns
  setupPresetListeners();
  
  // Output tabs
  setupOutputTabs();
  
  // Copy and download buttons
  setupCopyDownloadButtons();
  
  // Dismiss error button
  const dismissErrorBtn = document.getElementById('dismiss-error');
  if (dismissErrorBtn) {
    dismissErrorBtn.addEventListener('click', hideError);
  }
}

/**
 * Set up preset configuration listeners
 */
function setupPresetListeners() {
  // Input deserializer preset
  const inputDeserializerPreset = document.getElementById('input-deserializer-preset') as HTMLSelectElement;
  if (inputDeserializerPreset) {
    inputDeserializerPreset.addEventListener('change', (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      updateInputDeserializerOptions(preset);
    });
  }
  
  // JSON config preset
  const jsonConfigPreset = document.getElementById('json-config-preset') as HTMLSelectElement;
  if (jsonConfigPreset) {
    jsonConfigPreset.addEventListener('change', (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      updateJsonOptions(preset);
    });
  }
  
  // YAML config preset
  const yamlConfigPreset = document.getElementById('yaml-config-preset') as HTMLSelectElement;
  if (yamlConfigPreset) {
    yamlConfigPreset.addEventListener('change', (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      updateYamlOptions(preset);
    });
  }
  
  // XML config preset
  const xmlConfigPreset = document.getElementById('xml-config-preset') as HTMLSelectElement;
  if (xmlConfigPreset) {
    xmlConfigPreset.addEventListener('change', (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      updateXmlOptions(preset);
    });
  }
}

/**
 * Set up output tab switching
 */
function setupOutputTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = (e.target as HTMLElement).getAttribute('data-tab');
      if (tabName) {
        switchOutputTab(tabName);
      }
    });
  });
}

/**
 * Set up copy and download button handlers
 */
function setupCopyDownloadButtons() {
  const formats = ['xml', 'json', 'yaml', 'typescript'];
  formats.forEach(format => {
    const copyBtn = document.getElementById(`copy-${format}`);
    const downloadBtn = document.getElementById(`download-${format}`);
    
    if (copyBtn) {
      copyBtn.addEventListener('click', () => copyToClipboard(format));
    }
    
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => downloadOutput(format));
    }
  });
}

/**
 * Handle input format change
 */
function handleInputFormatChange(e: Event) {
  currentInputFormat = (e.target as HTMLSelectElement).value;
  validateInput();
}

/**
 * Load an example into the input textarea
 */
function loadExample(exampleKey: string) {
  const example = EXAMPLES[exampleKey as keyof typeof EXAMPLES];
  if (!example) {
    console.error('Example not found:', exampleKey);
    return;
  }
  
  const inputTextarea = document.getElementById('input-text') as HTMLTextAreaElement;
  const formatSelect = document.getElementById('input-format') as HTMLSelectElement;
  
  if (inputTextarea && formatSelect) {
    // Load the appropriate format
    const format = formatSelect.value;
    inputTextarea.value = example[format as keyof typeof example] as string || example.json;
    currentInputFormat = format;
    
    // Update character count and validation
    handleInputChange();
  }
}

/**
 * Handle file upload
 */
async function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const inputTextarea = document.getElementById('input-text') as HTMLTextAreaElement;
    if (inputTextarea) {
      inputTextarea.value = text;
      handleInputChange();
      
      // Try to detect format from file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xml' || ext === 'json' || ext === 'yaml' || ext === 'yml') {
        const formatSelect = document.getElementById('input-format') as HTMLSelectElement;
        if (formatSelect) {
          formatSelect.value = ext === 'yml' ? 'yaml' : ext;
          currentInputFormat = formatSelect.value;
        }
      }
    }
  } catch (error) {
    console.error('Error reading file:', error);
    showError('Failed to read file: ' + (error as Error).message);
  }
}

/**
 * Clear the input textarea
 */
function clearInput() {
  const inputTextarea = document.getElementById('input-text') as HTMLTextAreaElement;
  if (inputTextarea) {
    inputTextarea.value = '';
    handleInputChange();
  }
}

/**
 * Handle input text change
 */
function handleInputChange() {
  const inputTextarea = document.getElementById('input-text') as HTMLTextAreaElement;
  if (!inputTextarea) return;
  
  const text = inputTextarea.value;
  
  // Update character count
  const charCount = document.getElementById('char-count');
  if (charCount) {
    charCount.textContent = text.length.toString();
  }
  
  // Update line count
  const lineCount = document.getElementById('line-count');
  if (lineCount) {
    lineCount.textContent = (text.split('\n').length).toString();
  }
  
  // Validate input
  validateInput();
}

/**
 * Validate the input text
 */
function validateInput() {
  const inputTextarea = document.getElementById('input-text') as HTMLTextAreaElement;
  const validationIcon = document.getElementById('validation-icon');
  const validationText = document.getElementById('validation-text');
  
  if (!inputTextarea || !validationIcon || !validationText) return;
  
  const text = inputTextarea.value.trim();
  if (!text) {
    validationIcon.textContent = '○';
    validationIcon.className = 'status-icon';
    validationText.textContent = 'Empty';
    return;
  }
  
  // Simple format validation
  try {
    if (currentInputFormat === 'json') {
      JSON.parse(text);
      validationIcon.textContent = '✓';
      validationIcon.className = 'status-icon valid';
      validationText.textContent = 'Valid JSON';
    } else if (currentInputFormat === 'xml') {
      // Basic XML check
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        throw new Error('XML parse error');
      }
      validationIcon.textContent = '✓';
      validationIcon.className = 'status-icon valid';
      validationText.textContent = 'Valid XML';
    } else if (currentInputFormat === 'yaml') {
      // YAML validation will be done during conversion
      validationIcon.textContent = '✓';
      validationIcon.className = 'status-icon valid';
      validationText.textContent = 'Assumed valid YAML';
    }
  } catch (error) {
    validationIcon.textContent = '✗';
    validationIcon.className = 'status-icon invalid';
    validationText.textContent = `Invalid ${currentInputFormat.toUpperCase()}`;
  }
}

/**
 * Handle convert button click
 */
async function handleConvert() {
  console.log('🔄 Converting...');
  showLoading();
  hideError();
  
  try {
    const inputTextarea = document.getElementById('input-text') as HTMLTextAreaElement;
    if (!inputTextarea) throw new Error('Input textarea not found');
    
    const inputText = inputTextarea.value.trim();
    if (!inputText) throw new Error('Input is empty');
    
    // Gather conversion options from UI
    const options = gatherConversionOptions();
    
    // Perform conversion
    const result = await convert(inputText, options);
    
    hideLoading();
    
    if (!result.success) {
      showError(result.error || 'Conversion failed');
      return;
    }
    
    // Update output panels
    if (result.outputs) {
      updateOutputs(result.outputs);
    }
    
    console.log('✅ Conversion successful');
    
  } catch (error) {
    hideLoading();
    console.error('Conversion error:', error);
    showError((error as Error).message);
  }
}

/**
 * Gather conversion options from UI controls
 */
function gatherConversionOptions(): ConversionOptions {
  // Input format
  const inputFormatSelect = document.getElementById('input-format') as HTMLSelectElement;
  const inputFormat = (inputFormatSelect?.value || 'json') as InputFormat;
  
  // Input deserializer config
  const inputDeserializerPreset = (document.getElementById('input-deserializer-preset') as HTMLSelectElement)?.value || 'default';
  const inputDeserializerConfig = getJsonDeserializeConfigPreset(inputDeserializerPreset);
  
  // Output formats
  const outputFormats: OutputFormat[] = [];
  if ((document.getElementById('output-xml') as HTMLInputElement)?.checked) {
    outputFormats.push('xml');
  }
  if ((document.getElementById('output-json') as HTMLInputElement)?.checked) {
    outputFormats.push('json');
  }
  if ((document.getElementById('output-yaml') as HTMLInputElement)?.checked) {
    outputFormats.push('yaml');
  }
  if ((document.getElementById('output-typescript') as HTMLInputElement)?.checked) {
    outputFormats.push('typescript');
  }
  
  // JSON serializer type and config
  const jsonSerializerType = ((document.getElementById('json-serializer-type') as HTMLSelectElement)?.value || 'configurable') as 'canonical' | 'configurable';
  const jsonConfigPreset = (document.getElementById('json-config-preset') as HTMLSelectElement)?.value || 'canonical';
  const jsonConfig = getJsonConfigPreset(jsonConfigPreset);
  
  // Apply custom JSON settings if preset is 'custom'
  if (jsonConfigPreset === 'custom') {
    const indent = parseInt((document.getElementById('json-indent') as HTMLInputElement)?.value || '2');
    jsonConfig.indent = indent;
    jsonConfig.useTerseFormat = (document.getElementById('json-terse') as HTMLInputElement)?.checked || false;
    jsonConfig.useHybridStyle = (document.getElementById('json-hybrid') as HTMLInputElement)?.checked || false;
    jsonConfig.useTypeInference = (document.getElementById('json-type-inference') as HTMLInputElement)?.checked || false;
  }
  
  // YAML config
  const yamlConfigPreset = (document.getElementById('yaml-config-preset') as HTMLSelectElement)?.value || 'default';
  const yamlConfig = getYamlConfigPreset(yamlConfigPreset);
  
  // Apply custom YAML settings if preset is 'custom'
  if (yamlConfigPreset === 'custom') {
    const indent = parseInt((document.getElementById('yaml-indent') as HTMLInputElement)?.value || '2');
    yamlConfig.indent = indent;
    yamlConfig.useTerseFormat = (document.getElementById('yaml-terse') as HTMLInputElement)?.checked !== false;
    yamlConfig.useTypeInference = (document.getElementById('yaml-type-inference') as HTMLInputElement)?.checked !== false;
  }
  
  // XML config
  const xmlConfigPreset = (document.getElementById('xml-config-preset') as HTMLSelectElement)?.value || 'default';
  const xmlIndent = parseInt((document.getElementById('xml-indent') as HTMLInputElement)?.value || '2');
  const xmlConfig = {
    prettyPrint: (document.getElementById('xml-pretty') as HTMLInputElement)?.checked !== false,
    indent: xmlIndent,
    includeDeclaration: (document.getElementById('xml-declaration') as HTMLInputElement)?.checked !== false,
    includeNamespaces: (document.getElementById('xml-namespaces') as HTMLInputElement)?.checked !== false,
  };
  
  // TypeScript config
  const tsIndent = parseInt((document.getElementById('ts-indent') as HTMLInputElement)?.value || '2');
  const typescriptConfig = {
    useTerse: (document.getElementById('ts-terse') as HTMLInputElement)?.checked !== false,
    useCompactConstructors: (document.getElementById('ts-compact') as HTMLInputElement)?.checked !== false,
    includeComments: (document.getElementById('ts-comments') as HTMLInputElement)?.checked || false,
    indent: tsIndent,
  };
  
  return {
    inputFormat,
    inputDeserializerConfig,
    outputFormats,
    jsonSerializerType,
    jsonConfig,
    yamlConfig,
    xmlConfig,
    typescriptConfig,
  };
}

/**
 * Update output panels with converted data
 */
function updateOutputs(outputs: Record<string, string>) {
  if (outputs.xml) {
    const xmlContent = document.getElementById('output-xml-content');
    if (xmlContent) {
      xmlContent.textContent = outputs.xml;
    }
  }
  
  if (outputs.json) {
    const jsonContent = document.getElementById('output-json-content');
    if (jsonContent) {
      jsonContent.textContent = outputs.json;
    }
  }
  
  if (outputs.yaml) {
    const yamlContent = document.getElementById('output-yaml-content');
    if (yamlContent) {
      yamlContent.textContent = outputs.yaml;
    }
  }
  
  if (outputs.typescript) {
    const tsContent = document.getElementById('output-typescript-content');
    if (tsContent) {
      tsContent.textContent = outputs.typescript;
    }
  }
}

/**
 * Update input deserializer options based on preset
 */
function updateInputDeserializerOptions(preset: string) {
  const strictCheckbox = document.getElementById('input-strict') as HTMLInputElement;
  const terseCheckbox = document.getElementById('input-parse-terse') as HTMLInputElement;
  const incompleteCheckbox = document.getElementById('input-allow-incomplete') as HTMLInputElement;
  
  const isCustom = preset === 'custom';
  
  [strictCheckbox, terseCheckbox, incompleteCheckbox].forEach(checkbox => {
    if (checkbox) checkbox.disabled = !isCustom;
  });
  
  if (!isCustom && strictCheckbox && terseCheckbox && incompleteCheckbox) {
    // Set values based on preset
    switch (preset) {
      case 'canonical':
        strictCheckbox.checked = true;
        terseCheckbox.checked = false;
        incompleteCheckbox.checked = false;
        break;
      case 'compact':
        strictCheckbox.checked = false;
        terseCheckbox.checked = true;
        incompleteCheckbox.checked = false;
        break;
      case 'hybrid':
        strictCheckbox.checked = false;
        terseCheckbox.checked = true;
        incompleteCheckbox.checked = true;
        break;
      default: // 'default'
        strictCheckbox.checked = false;
        terseCheckbox.checked = false;
        incompleteCheckbox.checked = false;
    }
  }
}

/**
 * Update JSON options based on preset
 */
function updateJsonOptions(preset: string) {
  // Get all JSON option checkboxes and inputs
  const prettyCheckbox = document.getElementById('json-pretty') as HTMLInputElement;
  const indentInput = document.getElementById('json-indent') as HTMLInputElement;
  const terseCheckbox = document.getElementById('json-terse') as HTMLInputElement;
  const hybridCheckbox = document.getElementById('json-hybrid') as HTMLInputElement;
  const typeInferenceCheckbox = document.getElementById('json-type-inference') as HTMLInputElement;
  const includeNullCheckbox = document.getElementById('json-include-null') as HTMLInputElement;
  const includeEmptyCheckbox = document.getElementById('json-include-empty') as HTMLInputElement;
  
  const isCustom = preset === 'custom';
  
  // Enable/disable based on custom
  [prettyCheckbox, indentInput, terseCheckbox, hybridCheckbox, typeInferenceCheckbox, includeNullCheckbox, includeEmptyCheckbox].forEach(elem => {
    if (elem) elem.disabled = !isCustom;
  });
  
  if (!isCustom) {
    // Apply preset values
    switch (preset) {
      case 'canonical':
        if (prettyCheckbox) prettyCheckbox.checked = true;
        if (terseCheckbox) terseCheckbox.checked = false;
        if (hybridCheckbox) hybridCheckbox.checked = false;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = false;
        if (includeEmptyCheckbox) includeEmptyCheckbox.checked = true;
        break;
      case 'compact':
        if (prettyCheckbox) prettyCheckbox.checked = true;
        if (terseCheckbox) terseCheckbox.checked = false;
        if (hybridCheckbox) hybridCheckbox.checked = false;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
        if (includeEmptyCheckbox) includeEmptyCheckbox.checked = false;
        break;
      case 'hybrid':
        if (prettyCheckbox) prettyCheckbox.checked = true;
        if (terseCheckbox) terseCheckbox.checked = true;
        if (hybridCheckbox) hybridCheckbox.checked = true;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
        if (includeEmptyCheckbox) includeEmptyCheckbox.checked = false;
        break;
      case 'very-compact':
        if (prettyCheckbox) prettyCheckbox.checked = true;
        if (terseCheckbox) terseCheckbox.checked = true;
        if (hybridCheckbox) hybridCheckbox.checked = false;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
        if (includeEmptyCheckbox) includeEmptyCheckbox.checked = false;
        break;
    }
  }
}

/**
 * Update YAML options based on preset
 */
function updateYamlOptions(preset: string) {
  const blockStyleCheckbox = document.getElementById('yaml-block-style') as HTMLInputElement;
  const hybridStyleCheckbox = document.getElementById('yaml-hybrid-style') as HTMLInputElement;
  const terseCheckbox = document.getElementById('yaml-terse') as HTMLInputElement;
  const typeInferenceCheckbox = document.getElementById('yaml-type-inference') as HTMLInputElement;
  const indentInput = document.getElementById('yaml-indent') as HTMLInputElement;
  
  const isCustom = preset === 'custom';
  
  [blockStyleCheckbox, hybridStyleCheckbox, terseCheckbox, typeInferenceCheckbox, indentInput].forEach(elem => {
    if (elem) elem.disabled = !isCustom;
  });
  
  if (!isCustom) {
    switch (preset) {
      case 'default':
        if (blockStyleCheckbox) blockStyleCheckbox.checked = true;
        if (terseCheckbox) terseCheckbox.checked = true;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
        break;
      case 'verbose':
        if (blockStyleCheckbox) blockStyleCheckbox.checked = true;
        if (terseCheckbox) terseCheckbox.checked = false;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = false;
        break;
      case 'hybrid':
        if (hybridStyleCheckbox) hybridStyleCheckbox.checked = true;
        if (terseCheckbox) terseCheckbox.checked = true;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = true;
        break;
      case 'flow':
        if (blockStyleCheckbox) blockStyleCheckbox.checked = false;
        if (terseCheckbox) terseCheckbox.checked = false;
        if (typeInferenceCheckbox) typeInferenceCheckbox.checked = false;
        break;
    }
  }
}

/**
 * Update XML options based on preset
 */
function updateXmlOptions(preset: string) {
  const prettyCheckbox = document.getElementById('xml-pretty') as HTMLInputElement;
  const namespacesCheckbox = document.getElementById('xml-namespaces') as HTMLInputElement;
  const declarationCheckbox = document.getElementById('xml-declaration') as HTMLInputElement;
  const indentInput = document.getElementById('xml-indent') as HTMLInputInput;
  
  const isCustom = preset === 'custom';
  
  [prettyCheckbox, namespacesCheckbox, declarationCheckbox, indentInput].forEach(elem => {
    if (elem) elem.disabled = !isCustom;
  });
  
  if (!isCustom && prettyCheckbox && namespacesCheckbox && declarationCheckbox) {
    // Default preset
    prettyCheckbox.checked = true;
    namespacesCheckbox.checked = true;
    declarationCheckbox.checked = true;
  }
}

/**
 * Switch to a different output tab
 */
function switchOutputTab(tabName: string) {
  // Update tab buttons
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Update tab panes
  const panes = document.querySelectorAll('.tab-pane');
  panes.forEach(pane => {
    if (pane.id === `tab-${tabName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
}

/**
 * Copy output to clipboard
 */
async function copyToClipboard(format: string) {
  const outputElement = document.getElementById(`output-${format}-content`);
  if (!outputElement) {
    console.error('Output element not found:', format);
    return;
  }
  
  const text = outputElement.textContent || '';
  
  try {
    await navigator.clipboard.writeText(text);
    showSuccessMessage(format);
  } catch (error) {
    console.error('Failed to copy:', error);
    showError('Failed to copy to clipboard');
  }
}

/**
 * Download output as a file
 */
function downloadOutput(format: string) {
  const outputElement = document.getElementById(`output-${format}-content`);
  if (!outputElement) {
    console.error('Output element not found:', format);
    return;
  }
  
  const text = outputElement.textContent || '';
  const extensions: Record<string, string> = {
    xml: 'xml',
    json: 'json',
    yaml: 'yaml',
    typescript: 'ts'
  };
  
  const ext = extensions[format] || 'txt';
  const filename = `openehr_output.${ext}`;
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Show success message after copy
 */
function showSuccessMessage(format: string) {
  const successElement = document.getElementById(`success-${format}`);
  if (successElement) {
    successElement.classList.remove('hidden');
    setTimeout(() => {
      successElement.classList.add('hidden');
    }, 2000);
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const loadingState = document.getElementById('loading-state');
  if (loadingState) {
    loadingState.classList.remove('hidden');
  }
}

/**
 * Hide loading state
 */
function hideLoading() {
  const loadingState = document.getElementById('loading-state');
  if (loadingState) {
    loadingState.classList.add('hidden');
  }
}

/**
 * Show error message
 */
function showError(message: string) {
  const errorState = document.getElementById('error-state');
  const errorText = document.getElementById('error-text');
  
  if (errorState && errorText) {
    errorText.textContent = message;
    errorState.classList.remove('hidden');
  }
}

/**
 * Hide error message
 */
function hideError() {
  const errorState = document.getElementById('error-state');
  if (errorState) {
    errorState.classList.add('hidden');
  }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
