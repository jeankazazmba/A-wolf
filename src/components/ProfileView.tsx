import React, { useState, useRef } from "react";
import { useCollab } from "../context/CollabContext";
import {
  Camera,
  User,
  Mail,
  BookOpen,
  Edit3,
  Check,
  X,
  CheckSquare,
  FileText,
  Calendar,
  Award,
  Upload,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const ProfileView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    updateProfilePhoto,
    currentUser,
    state,
  } = useCollab();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editEmail, setEditEmail] = useState(userProfile.email);
  const [editStudy, setEditStudy] = useState(userProfile.study);
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(userProfile.photoURL);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarColors = [
    { value: "bg-violet-600", label: "Violet" },
    { value: "bg-emerald-600", label: "Vert" },
    { value: "bg-rose-600", label: "Rose" },
    { value: "bg-sky-600", label: "Bleu" },
    { value: "bg-amber-500", label: "Ambre" },
    { value: "bg-indigo-700", label: "Indigo" },
    { value: "bg-pink-600", label: "Fuchsia" },
    { value: "bg-teal-600", label: "Teal" },
  ];

  const completedTasks = state.tasks.filter((t) => t.completed).length;
  const totalTasks = state.tasks.length;
  const totalCourses = state.courses.length;
  const totalResources = state.resources.length;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoPreview(dataUrl);
      updateProfilePhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(undefined);
    updateProfilePhoto("");
    localStorage.removeItem("awolf_user_photo");
  };

  const handleSave = () => {
    updateUserProfile({
      name: editName.trim() || userProfile.name,
      email: editEmail.trim() || userProfile.email,
      study: editStudy.trim() || userProfile.study,
      avatar: editAvatar,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(userProfile.name);
    setEditEmail(userProfile.email);
    setEditStudy(userProfile.study);
    setEditAvatar(userProfile.avatar);
    setIsEditing(false);
  };

  const initials = userProfile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10" id="profile-view">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden"
      >
        {/* Cover gradient */}
        <div className="h-28 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + actions row */}
          <div className="flex items-end justify-between -mt-14 mb-4">
            {/* Avatar upload zone */}
            <div className="relative group">
              {/* Photo or initials */}
              <div
                className={`w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden cursor-pointer transition-all ${
                  isDragging ? "ring-4 ring-violet-400 scale-105" : ""
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                title="Cliquer pour changer la photo de profil"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${userProfile.avatar} flex items-center justify-center text-white font-bold text-2xl`}>
                    {initials}
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <Camera className="w-6 h-6 text-white" />
                  <span className="text-white text-[10px] font-bold">Modifier</span>
                </div>
              </div>

              {/* Remove photo button */}
              {photoPreview && (
                <button
                  onClick={handleRemovePhoto}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-sm hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Supprimer la photo"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}

              {/* Upload badge */}
              <div
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center shadow-md border-2 border-white cursor-pointer hover:bg-violet-700 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5 text-white" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
                id="profile-photo-input"
              />
            </div>

            {/* Edit / Save buttons */}
            <div className="flex gap-2 items-center mt-16">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex gap-2"
                  >
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
                    >
                      <X className="w-3.5 h-3.5" /> Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors cursor-pointer shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Sauvegarder
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="edit"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer"
                    id="edit-profile-btn"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Modifier le profil
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* User info */}
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-slate-50"
                      placeholder="Votre nom complet"
                      id="profile-name-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-slate-50"
                      placeholder="votre@email.com"
                      id="profile-email-input"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Filière / Étude</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={editStudy}
                    onChange={(e) => setEditStudy(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-slate-50"
                    placeholder="Ex: Master Informatique, L3 Gestion..."
                    id="profile-study-input"
                  />
                </div>
              </div>
              {/* Avatar color picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Couleur d'avatar (si pas de photo)</label>
                <div className="flex flex-wrap gap-2">
                  {avatarColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setEditAvatar(c.value)}
                      className={`w-7 h-7 rounded-full ${c.value} cursor-pointer border-2 transition-all hover:scale-110 ${
                        editAvatar === c.value
                          ? "border-slate-800 scale-110 shadow-md"
                          : "border-white shadow-sm"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div>
              <h1 className="text-xl font-bold text-slate-900">{userProfile.name}</h1>
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                {userProfile.study}
              </p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                {userProfile.email}
              </p>
              {currentUser?.uid && (
                <p className="text-[10px] text-slate-300 mt-1 font-mono">UID: {currentUser.uid}</p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Photo Upload Helper Card */}
      {!photoPreview && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => fileInputRef.current?.click()}
          id="photo-upload-hint-card"
        >
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
            <Camera className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-violet-900">Ajouter une photo de profil</h3>
            <p className="text-xs text-violet-600 mt-0.5">
              Cliquez ici ou glissez une image sur votre avatar • JPG, PNG, WebP acceptés
            </p>
          </div>
          <div className="ml-auto">
            <div className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-colors">
              Parcourir
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          {
            label: "Tâches terminées",
            value: `${completedTasks}/${totalTasks}`,
            icon: CheckSquare,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
          },
          {
            label: "Cours planifiés",
            value: totalCourses,
            icon: Calendar,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            label: "Ressources",
            value: totalResources,
            icon: FileText,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-100",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bg} border ${stat.border} rounded-2xl p-4 flex flex-col gap-2`}
            >
              <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
            </div>
          );
        })}
      </motion.div>

      {/* Account Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5"
      >
        <h2 className="font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-violet-500" /> Informations du compte
        </h2>
        <div className="space-y-3">
          {[
            { label: "Nom complet", value: userProfile.name, icon: User },
            { label: "Adresse email", value: userProfile.email, icon: Mail },
            { label: "Filière / Étude", value: userProfile.study, icon: BookOpen },
            { label: "Type de compte", value: currentUser?.isLocal ? "Compte local" : "Google Account", icon: User },
          ].map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{row.label}</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{row.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
