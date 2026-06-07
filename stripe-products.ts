/**
 * Stripe Products Configuration
 * Defines all subscription plans and pricing for P.A.W.S. platform
 */

export const STRIPE_PRODUCTS = {
  // Pet Profile Subscription - $27.39/year
  PET_PROFILE: {
    name: "Pet Profile",
    description: "Store and manage unlimited pet profiles with emergency information",
    priceInCents: 2739, // $27.39
    interval: "year" as const,
    features: [
      "Unlimited pet profiles",
      "Emergency contact information",
      "Pet photos and documents",
      "Access for emergency responders",
      "Lifetime membership for first 10K members"
    ]
  },

  // Medical Records Subscription - $27.39/year
  MEDICAL_RECORDS: {
    name: "Medical Records",
    description: "Track comprehensive medical history for your pets",
    priceInCents: 2739, // $27.39
    interval: "year" as const,
    features: [
      "Medical history tracking",
      "Medication management",
      "Allergy documentation",
      "Surgery and procedure records",
      "Vaccination tracking",
      "Vet visit history",
      "Emergency medical access"
    ]
  },

  // Behavioral/Social Challenges Subscription - $27.39/year
  BEHAVIORAL_CHALLENGES: {
    name: "Behavioral & Social Challenges",
    description: "Document and manage behavioral and social challenges",
    priceInCents: 2739, // $27.39
    interval: "year" as const,
    features: [
      "Behavioral issue documentation",
      "Anxiety tracking",
      "Aggression management",
      "Fear and phobia records",
      "Reactivity tracking",
      "Separation anxiety documentation",
      "Management strategies and tips"
    ]
  },

  // Add-on prices
  ADDON_PET: {
    name: "Additional Pet Profile",
    description: "Add another pet to your account",
    priceInCents: 999, // $9.99
    interval: "year" as const
  },

  ADDON_MEDICAL: {
    name: "Additional Medical Record",
    description: "Add more medical records for existing pets",
    priceInCents: 999, // $9.99
    interval: "year" as const
  },

  ADDON_BEHAVIORAL: {
    name: "Additional Behavioral Client",
    description: "Track behavioral challenges for another pet",
    priceInCents: 999, // $9.99
    interval: "year" as const
  }
};

/**
 * Coverage Information
 * What users' subscription fees cover
 */
export const COVERAGE_INFO = {
  title: "What Your Subscription Covers",
  items: [
    {
      icon: "🖥️",
      title: "Storage Units & Servers",
      description: "Secure cloud infrastructure for your pet data"
    },
    {
      icon: "⚙️",
      title: "Hardware & Software",
      description: "Enterprise-grade systems and maintenance"
    },
    {
      icon: "👨‍💼",
      title: "System Analyst",
      description: "Professional system monitoring and optimization"
    },
    {
      icon: "☁️",
      title: "Cloud Developer",
      description: "Continuous platform development and improvements"
    },
    {
      icon: "🔒",
      title: "Cybersecurity of Datacenter",
      description: "24/7 security monitoring and data protection"
    }
  ]
};
