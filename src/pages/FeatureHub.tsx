/**
 * FeatureHub - Navigation hub page for all patient recovery features
 *
 * Displays a responsive grid of feature cards, each linking to its sub-route.
 * Accessible from the patient dashboard.
 *
 * Grid layout:
 * - Mobile: 2 columns
 * - Tablet: 3 columns
 * - Desktop: 4 columns
 *
 * Design language: matches PatientDashboard (white cards, rounded-2xl,
 * shadow-sm, medical-primary colors, Tailwind v4 theme tokens).
 */

import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { Header } from '../components/Header';
import { motion } from 'framer-motion';
import {
  Activity,
  HeartPulse,
  Stethoscope,
  UtensilsCrossed,
  Moon,
  BookOpen,
  Pill,
  Dumbbell,
  MessageCircle,
  Video,
  Trophy,
  BarChart3,
  ShieldAlert,
  Download,
  Watch,
  ArrowLeft,
  AlertTriangle,
  Brain,
  Droplets,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Heart,
  Hospital,
  Layers,
  ListChecks,
  Microscope,
  Network,
  PersonStanding,
  ScrollText,
  Search,
  Shield,
  Sparkles,
  Target,
  TestTube,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Feature card configuration
// ---------------------------------------------------------------------------

interface FeatureCardConfig {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const FEATURES: FeatureCardConfig[] = [
  {
    title: 'Pain Tracker',
    description: 'Track pain levels',
    path: '/patient/pain',
    icon: Activity,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    title: 'Vital Signs',
    description: 'Monitor vital signs',
    path: '/patient/vitals',
    icon: HeartPulse,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    title: 'Symptom Checker',
    description: 'AI symptom assessment',
    path: '/patient/symptoms',
    icon: Stethoscope,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Nutrition',
    description: 'Track meals and nutrition',
    path: '/patient/nutrition',
    icon: UtensilsCrossed,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    title: 'Sleep Tracking',
    description: 'Monitor sleep patterns',
    path: '/patient/sleep',
    icon: Moon,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    title: 'Journal',
    description: 'Recovery journal',
    path: '/patient/journal',
    icon: BookOpen,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    title: 'Medications',
    description: 'Medication management',
    path: '/patient/medications',
    icon: Pill,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Exercise',
    description: 'Exercise programs',
    path: '/patient/exercise',
    icon: Dumbbell,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    title: 'Chat',
    description: 'Message care team',
    path: '/patient/chat',
    icon: MessageCircle,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    title: 'Telehealth',
    description: 'Virtual visits',
    path: '/patient/telehealth',
    icon: Video,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    title: 'Gamification',
    description: 'Badges & rewards',
    path: '/patient/achievements',
    icon: Trophy,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    title: 'Analytics',
    description: 'Health insights',
    path: '/patient/analytics',
    icon: BarChart3,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    title: 'Emergency',
    description: 'Emergency protocols',
    path: '/patient/emergency',
    icon: ShieldAlert,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    title: 'Data Export',
    description: 'Export health data',
    path: '/patient/export',
    icon: Download,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
  {
    title: 'Wearables',
    description: 'Device integration',
    path: '/patient/wearables',
    icon: Watch,
    iconBg: 'bg-fuchsia-100',
    iconColor: 'text-fuchsia-600',
  },
  // --- ML/AI Models ---
  { title: 'Drug Interactions', description: 'CYP450 interaction checker', path: '/patient/drug-interactions', icon: Zap, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  { title: 'Readmission Risk', description: 'HOSPITAL & LACE scores', path: '/patient/readmission-risk', icon: TrendingUp, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { title: 'Wound Healing', description: 'Wagner & PUSH scoring', path: '/patient/wound-healing', icon: Target, iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { title: 'Med Adherence', description: 'MMAS-8 prediction', path: '/patient/medication-adherence', icon: ListChecks, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { title: 'Clinical NLP', description: 'Entity extraction', path: '/patient/clinical-nlp', icon: Brain, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  { title: 'Complications', description: 'Bayesian risk network', path: '/patient/complication-network', icon: Network, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { title: 'Patient Clusters', description: 'Recovery phenotypes', path: '/patient/patient-clustering', icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { title: 'Treatment Response', description: 'Response prediction', path: '/patient/treatment-response', icon: Sparkles, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  // --- Clinical Decision Support ---
  { title: 'Sepsis Warning', description: 'qSOFA/SIRS/SOFA', path: '/patient/sepsis-warning', icon: AlertTriangle, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  { title: 'DVT Risk', description: 'Caprini & Wells scores', path: '/patient/dvt-risk', icon: Droplets, iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  { title: 'Fall Risk', description: 'Morse & Hendrich II', path: '/patient/fall-risk', icon: PersonStanding, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  { title: 'Pain Protocol', description: 'WHO Pain Ladder', path: '/patient/pain-protocol', icon: Heart, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { title: 'Nutrition Screen', description: 'NRS-2002 & MUST', path: '/patient/nutritional-screening', icon: UtensilsCrossed, iconBg: 'bg-lime-100', iconColor: 'text-lime-600' },
  { title: 'SSI Predictor', description: 'Surgical site infection', path: '/patient/ssi-predictor', icon: Shield, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  { title: 'Blood Glucose', description: 'ADA glucose monitoring', path: '/patient/blood-glucose', icon: Droplets, iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
  { title: 'Antibiotics', description: 'Stewardship engine', path: '/patient/antibiotic-stewardship', icon: FlaskConical, iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  // --- Patient Engagement ---
  { title: 'Translation', description: 'Medical term translator', path: '/patient/medical-translation', icon: Globe, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { title: 'Education', description: 'Patient education', path: '/patient/patient-education', icon: GraduationCap, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { title: 'Caregiver Access', description: 'Caregiver management', path: '/patient/caregiver-access', icon: Users, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  { title: 'Appointments', description: 'Smart scheduling', path: '/patient/appointment-scheduling', icon: ListChecks, iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { title: 'Milestones', description: 'Recovery tracking', path: '/patient/recovery-milestones', icon: Target, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  { title: 'Satisfaction', description: 'HCAHPS & NPS', path: '/patient/patient-satisfaction', icon: Trophy, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { title: 'Symptom Patterns', description: 'CUSUM detection', path: '/patient/symptom-patterns', icon: TrendingUp, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { title: 'Rehabilitation', description: 'FIM & rehab protocols', path: '/patient/rehabilitation', icon: Dumbbell, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  // --- Clinical Operations ---
  { title: 'Clinical Pathway', description: 'ERAS protocols', path: '/patient/clinical-pathway', icon: Layers, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { title: 'Handoff', description: 'SBAR communication', path: '/patient/handoff-communication', icon: ScrollText, iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
  { title: 'Lab Results', description: '60+ test interpreter', path: '/patient/lab-results', icon: TestTube, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  { title: 'Vital Forecast', description: 'NEWS2 & MEWS', path: '/patient/vital-forecast', icon: TrendingUp, iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  { title: 'Alert Fatigue', description: 'Smart suppression', path: '/patient/alert-fatigue', icon: Zap, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  { title: 'Quality Metrics', description: 'CMS measures & SPC', path: '/patient/quality-metrics', icon: BarChart3, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { title: 'Bed Management', description: 'ADT & capacity', path: '/patient/bed-management', icon: Hospital, iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  { title: 'Staff Workload', description: 'Acuity balancing', path: '/patient/staff-workload', icon: Users, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  // --- Data & Integration ---
  { title: 'FHIR Resources', description: 'HL7 FHIR R4', path: '/patient/fhir-resources', icon: FileText, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { title: 'Clinical Docs', description: 'CDA generation', path: '/patient/clinical-documents', icon: ScrollText, iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
  { title: 'Formulary', description: 'Pharmacy checker', path: '/patient/pharmacy-formulary', icon: Pill, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { title: 'SDOH Screening', description: 'PRAPARE & AHC HRSN', path: '/patient/sdoh-screening', icon: Heart, iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { title: 'Clinical Trials', description: 'Trial matching', path: '/patient/clinical-trials', icon: Search, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  { title: 'Population Health', description: 'Kaplan-Meier & Cox', path: '/patient/population-health', icon: Microscope, iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { title: 'Staffing Model', description: 'Predictive staffing', path: '/patient/predictive-staffing', icon: Users, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { title: 'Consent Mgmt', description: 'Digital consent', path: '/patient/consent-management', icon: Shield, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function FeatureHub() {
  const { currentUser, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) {
    return null;
  }

  const streakCount = currentUser.streakCount ?? 0;

  return (
    <div className="min-h-screen bg-medical-bg flex flex-col">
      <Header
        userName={currentUser.name}
        streakCount={streakCount}
        onLogout={handleLogout}
      />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Back button and page title */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/patient')}
            className="flex items-center gap-2 text-sm text-medical-primary font-medium hover:text-blue-700 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-medical-text">
            Feature Hub
          </h2>
          <p className="text-base text-gray-600 mt-1">
            Access all your recovery tools in one place.
          </p>
        </div>

        {/* Feature cards grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.path}
                type="button"
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(feature.path)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center gap-3 hover:shadow-md hover:border-medical-primary/20 transition-all cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.iconBg}`}
                >
                  <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-medical-text leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
