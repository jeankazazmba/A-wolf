import React, { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface LicenseAgreementProps {
  onAccept: () => void;
}

export const LicenseAgreement: React.FC<LicenseAgreementProps> = ({ onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      localStorage.setItem("awolf_license_accepted", "true");
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Conditions de Licence</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold mb-2">Accord de Licence A-Wolf</h2>
              <p className="text-sm">
                Bienvenue dans A-Wolf, votre assistant de gestion des tâches et calendrier personnel.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">1. Utilisation Autorisée</h3>
              <p className="text-sm">
                Cette application est fournie à titre gratuit à usage personnel et non commercial.
                Vous vous engagez à l'utiliser conformément à tous les termes et conditions énoncés.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. Restrictions</h3>
              <p className="text-sm">
                L'utilisateur s'engage à ne pas :
              </p>
              <ul className="text-sm list-disc list-inside ml-2 mt-1">
                <li>Reproduire ou distribuer l'application sans autorisation</li>
                <li>Modifier ou transformer l'application</li>
                <li>Utiliser l'application à des fins commerciales</li>
                <li>Contourner les mécanismes de sécurité</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Données et Confidentialité</h3>
              <p className="text-sm">
                Vos données de calendrier et de tâches sont synchronisées avec votre compte Google 
                uniquement si vous choisissez cette option. Toutes les authentifications locales 
                sont stockées de manière sécurisée.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Limitation de Responsabilité</h3>
              <p className="text-sm">
                L'application est fournie "tel quel" sans garantie d'aucune sorte. L'utilisateur 
                accepte l'utilisation à ses propres risques.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Términaison</h3>
              <p className="text-sm">
                Ces conditions peuvent être modifiées à tout moment. L'utilisation continue 
                de l'application signifie l'acceptation des modifications.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 rounded-b-lg space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">
              J'accepte les conditions de licence et j'affirme avoir téléchargé cette application 
              de manière légitime
            </span>
          </label>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => window.close()}
              disabled={accepted}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Quitter
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Continuer
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
