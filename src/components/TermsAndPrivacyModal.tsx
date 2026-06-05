import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle } from "lucide-react";

interface TermsAndPrivacyModalProps {
  isOpen: boolean;
  type: "terms" | "privacy";
  onClose: () => void;
  onAccept: () => void;
  isAccepted: boolean;
}

export const TermsAndPrivacyModal: React.FC<TermsAndPrivacyModalProps> = ({
  isOpen,
  type,
  onClose,
  onAccept,
  isAccepted,
}) => {
  const content =
    type === "terms"
      ? {
          title: "Conditions d'utilisation",
          sections: [
            {
              heading: "1. Acceptation des conditions",
              content:
                "En accédant et en utilisant A-Wolf, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser cette application.",
            },
            {
              heading: "2. Description du service",
              content:
                "A-Wolf est une application collaborative de gestion des tâches, calendrier et ressources. Elle permet aux utilisateurs de gérer leurs projets, tâches et collaborations de manière sécurisée et locale.",
            },
            {
              heading: "3. Compte utilisateur",
              content:
                "Vous êtes responsable du maintien de la confidentialité de vos identifiants d'authentification. Vous acceptez d'être responsable de toute activité qui se produit sous votre compte. Vous vous engagez à notifier immédiatement A-Wolf de tout accès non autorisé à votre compte.",
            },
            {
              heading: "4. Limitations de responsabilité",
              content:
                "A-Wolf est fourni 'tel quel' sans aucune garantie. A-Wolf ne sera pas responsable des dommages indirects, accessoires, spéciaux ou consécutifs résultant de l'utilisation ou de l'incapacité à utiliser l'application.",
            },
            {
              heading: "5. Modifications des conditions",
              content:
                "A-Wolf se réserve le droit de modifier ces conditions à tout moment. Votre utilisation continue de l'application après de telles modifications constitue votre acceptation des nouvelles conditions.",
            },
          ],
        }
      : {
          title: "Politique de confidentialité",
          sections: [
            {
              heading: "1. Collecte de données",
              content:
                "A-Wolf collecte uniquement les données que vous fournissez volontairement lors de votre inscription et utilisation du service, notamment votre nom, email et les données de projet que vous créez.",
            },
            {
              heading: "2. Stockage local des données",
              content:
                "Vos données sont stockées localement sur votre appareil. Aucune donnée n'est transmise à des serveurs externes sans votre consentement explicite.",
            },
            {
              heading: "3. Authentification Google OAuth",
              content:
                "A-Wolf utilise Google OAuth 2.0 pour l'authentification. Nous ne stockons jamais votre mot de passe. Votre jeton d'accès est chiffré et stocké de manière sécurisée via le système de clés de votre appareil.",
            },
            {
              heading: "4. Partage de données",
              content:
                "Vos données ne sont jamais vendues, louées ou partagées avec des tiers. Vous conservez la propriété complète de vos données. Le partage de données entre collaborateurs ne s'effectue que si vous le permettez explicitement.",
            },
            {
              heading: "5. Sécurité",
              content:
                "A-Wolf implémente des mesures de sécurité appropriées pour protéger vos données. Cependant, aucun système n'est complètement sécurisé. Vous acceptez les risques inhérents à l'utilisation d'Internet.",
            },
            {
              heading: "6. Vos droits",
              content:
                "Vous avez le droit d'accéder, de corriger ou de supprimer vos données personnelles à tout moment. Vous pouvez exporter vos données ou demander leur suppression complète.",
            },
          ],
        };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{content.title}</h2>
              <button
                onClick={onClose}
                className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-6">
                {content.sections.map((section, idx) => (
                  <div key={idx}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {section.heading}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 p-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-100 transition-all"
              >
                Fermer
              </button>
              <button
                onClick={onAccept}
                className={`flex-1 px-4 py-3 font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  isAccepted
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
              >
                {isAccepted && <CheckCircle className="w-5 h-5" />}
                {isAccepted ? "Accepté" : "J'accepte"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
