import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Impressum() {
  return (
    <>
      <Helmet>
        <title>Impressum - Henkes Stoffzauber</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-8">
              Impressum
            </h1>

            <div className="space-y-8">
              {/* Angaben gemäß § 5 TMG */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  Angaben gemäß § 5 TMG
                </h2>
                <div className="space-y-2 text-neutral-700">
                  <p className="font-medium text-lg">Stefan Henke</p>
                  <p>Henkes Stoffzauber</p>
                  <div className="flex items-start gap-2 mt-4">
                    <MapPin className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>Rheinstraße 40</p>
                      <p>47495 Rheinberg</p>
                      <p>Deutschland</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Kontakt */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  Kontakt
                </h2>
                <div className="space-y-3 text-neutral-700">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary-500" />
                    <a
                      href="tel:+4915565612722"
                      className="hover:text-primary-500 transition-colors"
                    >
                      015565 612722
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary-500" />
                    <a
                      href="mailto:info@henkes-stoffzauber.de"
                      className="hover:text-primary-500 transition-colors"
                    >
                      info@henkes-stoffzauber.de
                    </a>
                  </div>
                </div>
              </section>

              {/* Umsatzsteuer */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  Umsatzsteuer-ID
                </h2>
                <p className="text-neutral-700">
                  Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).
                </p>
              </section>

              {/* Verantwortlich für den Inhalt */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
                </h2>
                <div className="text-neutral-700">
                  <p className="font-medium">Stefan Henke</p>
                  <p>Rheinstraße 40</p>
                  <p>47495 Rheinberg</p>
                </div>
              </section>

              {/* EU-Streitschlichtung */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  EU-Streitschlichtung
                </h2>
                <p className="text-neutral-700">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:underline"
                  >
                    https://ec.europa.eu/consumers/odr
                  </a>
                </p>
                <p className="text-neutral-700 mt-2">
                  Unsere E-Mail-Adresse finden Sie oben im Impressum.
                </p>
              </section>

              {/* Verbraucherstreitbeilegung */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  Verbraucherstreitbeilegung / Universalschlichtungsstelle
                </h2>
                <p className="text-neutral-700">
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </section>

              {/* Haftung für Inhalte */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  Haftung für Inhalte
                </h2>
                <p className="text-neutral-700">
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen
                  Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind
                  wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte
                  fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
                  rechtswidrige Tätigkeit hinweisen.
                </p>
                <p className="text-neutral-700 mt-2">
                  Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach
                  den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung
                  ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung
                  möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese
                  Inhalte umgehend entfernen.
                </p>
              </section>

              {/* Haftung für Links */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  Haftung für Links
                </h2>
                <p className="text-neutral-700">
                  Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
                  keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
                  Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
                  Anbieter oder Betreiber der Seiten verantwortlich.
                </p>
              </section>

              {/* Urheberrecht */}
              <section>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  Urheberrecht
                </h2>
                <p className="text-neutral-700">
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
                  unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
                  Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
                  bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
