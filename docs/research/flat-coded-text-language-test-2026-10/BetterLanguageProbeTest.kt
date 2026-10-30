// Library probe for better-care/web-template (not a Better CDR, no validation step).
// Copy into src/test/kotlin/probe/ of a checkout of the tag under test and run:
//   mvn test -Dtest=BetterLanguageProbeTest -DargLine="-Dprobe.dir=<this folder> -Dprobe.opt=<path to OPT>"
// 3.2.9 uses javax.xml.bind; 5.0.1 uses jakarta.xml.bind (change the JAXBElement import).
package probe

import care.better.platform.jaxb.JaxbRegistry
import care.better.platform.web.template.builder.WebTemplateBuilder
import care.better.platform.web.template.builder.context.WebTemplateBuilderContext
import care.better.platform.web.template.converter.raw.context.ConversionContext
import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.xml.bind.JAXBElement
import org.junit.jupiter.api.Test
import org.openehr.am.aom.Template
import org.openehr.rm.composition.Composition
import java.io.File
import java.io.FileInputStream
import java.io.StringWriter
import javax.xml.namespace.QName
import javax.xml.transform.stream.StreamSource

class BetterLanguageProbeTest {
    @Test
    fun probe() {
        val dir = File(System.getProperty("probe.dir"))
        val om = ObjectMapper()
        @Suppress("UNCHECKED_CAST")
        val inputs = om.readValue(File(dir, "flat_inputs.json"), Map::class.java) as Map<String, Any?>
        @Suppress("UNCHECKED_CAST")
        val base = inputs["base"] as Map<String, Any?>
        @Suppress("UNCHECKED_CAST")
        val variants = inputs["variants"] as List<Map<String, Any?>>
        val template = JaxbRegistry.getInstance().unmarshaller
            .unmarshal(StreamSource(FileInputStream(File(System.getProperty("probe.opt")))), Template::class.java).value
        // Template default language sv, template languages sv and en.
        val webTemplate = WebTemplateBuilder.buildNonNull(template, WebTemplateBuilderContext("sv", listOf("sv", "en")))
        val results = variants.map { v ->
            val language = v["ctx/language"] as String
            @Suppress("UNCHECKED_CAST")
            val flat = base + mapOf("ctx/language" to language) + (v["leaf_input"] as Map<String, Any?>)
            val r = linkedMapOf<String, Any?>("id" to v["id"])
            try {
                val context = ConversionContext.create().withLanguage(language).withTerritory("SE").withComposerName("Test").build()
                val composition: Composition? = webTemplate.convertFromFlatToRaw(flat, context)
                val xml = StringWriter()
                JaxbRegistry.getInstance().marshaller.marshal(
                    JAXBElement(QName("http://schemas.openehr.org/v1", "composition"), Composition::class.java, composition), xml)
                r["canonical_xml"] = xml.toString()
            } catch (e: Throwable) {
                r["error"] = e.javaClass.name + ": " + e.message
            }
            r
        }
        om.writerWithDefaultPrettyPrinter().writeValue(File(dir, "better_probe_output.json"), results)
    }
}
