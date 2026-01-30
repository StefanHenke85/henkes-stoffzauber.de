import { Helmet } from 'react-helmet-async';
import { Shield, Lock, Database, Mail, Users } from 'lucide-react';

export function Datenschutz() {
  return (
    <>
      <Helmet>
        <title>Datenschutzerklärung - Henkes Stoffzauber</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="h-8 w-8 text-primary-500" />
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-800">
                Datenschutzerklärung
              </h1>
            </div>

            <div className="space-y-8">
              {/* Einleitung */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  1. Datenschutz auf einen Blick
                </h2>
                <h3 className="text-xl font-semibold text-neutral-800 mb-3">
                  Allgemeine Hinweise
                </h3>
                <p className="text-neutral-700">
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                  personenbezogenen Daten passiert, wenn Sie diesen Marktplatz nutzen. Personenbezogene
                  Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                </p>
              </section>

              {/* Verantwortliche Stelle */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  2. Verantwortliche Stelle (Plattformbetreiber)
                </h2>
                <div className="bg-primary-50 rounded-lg p-6">
                  <p className="text-neutral-700 font-medium mb-2">
                    Die verantwortliche Stelle für die Datenverarbeitung auf dieser Plattform ist:
                  </p>
                  <div className="text-neutral-700 space-y-1">
                    <p className="font-semibold">Stefan Henke</p>
                    <p>Henkes Stoffzauber - Marktplatz für handgenähte Unikate</p>
                    <p>Rheinstraße 40</p>
                    <p>47495 Rheinberg</p>
                    <p className="mt-3">
                      <span className="font-medium">E-Mail:</span>{' '}
                      <a
                        href="mailto:info@henkes-stoffzauber.de"
                        className="text-primary-500 hover:underline"
                      >
                        info@henkes-stoffzauber.de
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              {/* Hinweis zur Plattform */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary-500" />
                  3. Hinweis zum Marktplatz-Modell
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <p className="text-neutral-700 mb-3">
                    Henkes Stoffzauber ist ein Marktplatz, auf dem unabhängige Verkäufer ihre
                    selbstgenähten Produkte anbieten. Bei einer Bestellung werden Ihre Daten wie folgt verarbeitet:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-700 ml-4">
                    <li>
                      <strong>Plattformbetreiber (wir):</strong> Verarbeitet Ihre Daten für die
                      Abwicklung der Bestellung, Zahlungsabwicklung und Kundenservice
                    </li>
                    <li>
                      <strong>Verkäufer:</strong> Erhält die für den Versand notwendigen Daten
                      (Name, Lieferadresse) zur Auftragserfüllung
                    </li>
                  </ul>
                  <p className="text-neutral-700 mt-3">
                    Die Verkäufer sind verpflichtet, Ihre Daten nur für die Auftragsabwicklung zu
                    verwenden und die geltenden Datenschutzbestimmungen einzuhalten.
                  </p>
                </div>
              </section>

              {/* Datenerfassung */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  4. Datenerfassung auf dieser Plattform
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary-500" />
                      Welche Daten erfassen wir?
                    </h3>
                    <p className="text-neutral-700 mb-3">
                      Wir erfassen verschiedene Daten, wenn Sie unsere Plattform nutzen:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-neutral-700 ml-4">
                      <li>
                        <strong>Server-Log-Dateien:</strong> Technische Daten wie IP-Adresse,
                        Browsertyp, Betriebssystem, Datum und Uhrzeit des Zugriffs
                      </li>
                      <li>
                        <strong>Bestelldaten:</strong> Name, Adresse, E-Mail, Telefonnummer,
                        bestellte Produkte
                      </li>
                      <li>
                        <strong>Kontaktdaten:</strong> Wenn Sie uns per E-Mail kontaktieren
                      </li>
                      <li>
                        <strong>Verkäufer-Daten:</strong> Bei Registrierung als Verkäufer zusätzlich
                        Geschäftsdaten und Bankverbindung für Auszahlungen
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary-500" />
                      Wofür nutzen wir Ihre Daten?
                    </h3>
                    <p className="text-neutral-700 mb-3">
                      Ihre Daten werden ausschließlich für folgende Zwecke verwendet:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-neutral-700 ml-4">
                      <li>Bearbeitung und Abwicklung Ihrer Bestellungen</li>
                      <li>Weitergabe an Verkäufer für den Versand</li>
                      <li>Versand von Bestellbestätigungen und Rechnungen</li>
                      <li>Beantwortung Ihrer Anfragen</li>
                      <li>Gewährleistung der technischen Sicherheit der Plattform</li>
                      <li>Verwaltung von Verkäufer-Konten und Auszahlungen</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Hosting */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  5. Hosting
                </h2>
                <p className="text-neutral-700 mb-3">
                  Diese Plattform wird bei euserv gehostet. Der Anbieter ist:
                </p>
                <div className="bg-neutral-100 rounded-lg p-4 text-neutral-700">
                  <p className="font-medium">euserv GmbH</p>
                  <p>Industriestr. 19</p>
                  <p>07554 Korbußen</p>
                  <p>Deutschland</p>
                </div>
                <p className="text-neutral-700 mt-3">
                  Wenn Sie unsere Plattform besuchen, werden Ihre Daten auf den Servern von euserv
                  verarbeitet. Dies kann auch IP-Adressen, Kontaktanfragen und Meta- und
                  Kommunikationsdaten umfassen. Die Nutzung erfolgt auf Grundlage von Art. 6 Abs. 1
                  lit. f DSGVO (berechtigtes Interesse).
                </p>
              </section>

              {/* PayPal */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  6. Zahlungsdienstleister
                </h2>
                <h3 className="text-xl font-semibold text-neutral-800 mb-3">
                  PayPal
                </h3>
                <p className="text-neutral-700">
                  Auf dieser Plattform bieten wir die Bezahlung via PayPal an. Anbieter dieses
                  Zahlungsdienstes ist die PayPal (Europe) S.à.r.l. et Cie, S.C.A., 22-24 Boulevard
                  Royal, L-2449 Luxembourg (im Folgenden "PayPal").
                </p>
                <p className="text-neutral-700 mt-2">
                  Wenn Sie die Bezahlung via PayPal auswählen, werden die von Ihnen eingegebenen
                  Zahlungsdaten an PayPal übermittelt. Die Übermittlung Ihrer Daten an PayPal
                  erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) und Art. 6
                  Abs. 1 lit. b DSGVO (Verarbeitung zur Erfüllung eines Vertrags).
                </p>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  7. Cookies
                </h2>
                <p className="text-neutral-700">
                  Unsere Plattform verwendet technisch notwendige Cookies, um die
                  Funktionalität sicherzustellen:
                </p>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 ml-4 mt-3">
                  <li>Session-Cookies für die Warenkorb-Funktion</li>
                  <li>Authentifizierungs-Cookies für Verkäufer-Logins</li>
                </ul>
                <p className="text-neutral-700 mt-3">
                  Diese technisch notwendigen Cookies werden auf Grundlage von Art. 6 Abs. 1 lit. f
                  DSGVO eingesetzt. Es werden keine Tracking- oder Analyse-Cookies verwendet.
                </p>
              </section>

              {/* Analyse Tools */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  8. Analyse-Tools und Werbung
                </h2>
                <p className="text-neutral-700">
                  Wir verwenden derzeit <strong>keine</strong> Analyse-Tools wie Google Analytics,
                  Facebook Pixel oder ähnliche Tracking-Dienste. Es findet keine Datenerhebung zu
                  Marketing- oder Analysezwecken durch Dritte statt.
                </p>
              </section>

              {/* Newsletter */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                  <Mail className="h-6 w-6 text-primary-500" />
                  9. Newsletter
                </h2>
                <p className="text-neutral-700">
                  Aktuell bieten wir noch keinen Newsletter-Service an. Sollten wir in Zukunft einen
                  Newsletter anbieten, werden wir Sie vorab um Ihre ausdrückliche Einwilligung bitten
                  und Sie in dieser Datenschutzerklärung entsprechend informieren.
                </p>
              </section>

              {/* Ihre Rechte */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  10. Ihre Rechte
                </h2>
                <p className="text-neutral-700 mb-3">
                  Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
                </p>
                <ul className="list-disc list-inside space-y-2 text-neutral-700 ml-4">
                  <li>
                    <strong>Recht auf Auskunft:</strong> Sie können Auskunft über Ihre bei uns
                    gespeicherten Daten verlangen
                  </li>
                  <li>
                    <strong>Recht auf Berichtigung:</strong> Sie können die Berichtigung
                    unrichtiger Daten verlangen
                  </li>
                  <li>
                    <strong>Recht auf Löschung:</strong> Sie können die Löschung Ihrer Daten
                    verlangen
                  </li>
                  <li>
                    <strong>Recht auf Einschränkung:</strong> Sie können die Einschränkung der
                    Verarbeitung verlangen
                  </li>
                  <li>
                    <strong>Recht auf Datenübertragbarkeit:</strong> Sie können die Übertragung
                    Ihrer Daten an einen anderen Verantwortlichen verlangen
                  </li>
                  <li>
                    <strong>Widerspruchsrecht:</strong> Sie können der Verarbeitung Ihrer Daten
                    widersprechen
                  </li>
                  <li>
                    <strong>Beschwerderecht:</strong> Sie können sich bei einer Aufsichtsbehörde
                    beschweren
                  </li>
                </ul>
              </section>

              {/* SSL-Verschlüsselung */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  11. SSL- bzw. TLS-Verschlüsselung
                </h2>
                <p className="text-neutral-700">
                  Diese Plattform nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
                  vertraulicher Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns
                  als Plattformbetreiber senden, eine SSL- bzw. TLS-Verschlüsselung. Eine
                  verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers
                  von "http://" auf "https://" wechselt und an dem Schloss-Symbol in Ihrer
                  Browserzeile.
                </p>
              </section>

              {/* Datenlöschung */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  12. Speicherdauer
                </h2>
                <p className="text-neutral-700">
                  Wir speichern personenbezogene Daten nur so lange, wie dies für die Erfüllung der
                  verfolgten Zwecke notwendig ist oder wie es gesetzliche Aufbewahrungsfristen
                  vorsehen. Nach Wegfall des jeweiligen Zweckes bzw. Ablauf dieser Fristen werden
                  die entsprechenden Daten routinemäßig gesperrt oder gelöscht.
                </p>
                <p className="text-neutral-700 mt-2">
                  Bestelldaten werden gemäß handels- und steuerrechtlicher Vorgaben für einen
                  Zeitraum von bis zu 10 Jahren gespeichert.
                </p>
              </section>

              {/* Kontakt Datenschutz */}
              <section className="bg-primary-50 rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  Fragen zum Datenschutz?
                </h2>
                <p className="text-neutral-700 mb-3">
                  Wenn Sie Fragen zum Datenschutz haben, schreiben Sie uns bitte eine E-Mail:
                </p>
                <div className="text-neutral-700">
                  <p className="font-semibold">Stefan Henke (Plattformbetreiber)</p>
                  <p>
                    E-Mail:{' '}
                    <a
                      href="mailto:info@henkes-stoffzauber.de"
                      className="text-primary-500 hover:underline"
                    >
                      info@henkes-stoffzauber.de
                    </a>
                  </p>
                </div>
              </section>

              {/* Stand */}
              <section className="text-sm text-neutral-500 border-t pt-6">
                <p>Stand: Januar 2026</p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
