export interface Course {
  id: string;
  name: string;
  type: string;
  content: string; // Mock text for AI to generate questions from
}

export const MOCK_COURSES: Course[] = [
  {
    id: "1",
    name: "Advanced Calculus",
    type: "Mathematics",
    content: `Advanced calculus focuses on multivariable calculus, vector analysis, and differential forms. 
    Key concepts include:
    - Limits and continuity in multiple variables.
    - Partial derivatives and the gradient vector.
    - Multiple integrals (double and triple) and their applications in calculating volume and center of mass.
    - Vector fields, line integrals, and surface integrals.
    - Fundamental theorems of vector calculus: Green's Theorem, Stokes' Theorem, and the Divergence Theorem (Gauss's Theorem).
    - Taylor series for functions of several variables.
    - Optimization with constraints using Lagrange multipliers.`
  },
  {
    id: "2",
    name: "Modern Physics",
    type: "Science",
    content: `Modern physics deals with the post-Newtonian concepts of relativity and quantum mechanics.
    Key concepts include:
    - Special Relativity: time dilation, length contraction, and the equivalence of mass and energy (E=mc²).
    - Quantum Mechanics: wave-particle duality, the Heisenberg Uncertainty Principle, and the Schrödinger Equation.
    - Atomic Structure: the Bohr model, electron configurations, and quantum numbers.
    - Nuclear Physics: radioactive decay, fission, and fusion.
    - Particle Physics: the Standard Model, quarks, leptons, and bosons.
    - Solid State Physics: crystal structures, semiconductors, and superconductors.`
  },
  {
    id: "3",
    name: "Pharmaceutical Impurities",
    type: "Pharmacy",
    content: `Pharmaceutical impurities are unwanted chemicals that remain with the active pharmaceutical ingredients (APIs). 
    Classification of Impurities:
    - Organic Impurities (Process and Drug-related): Starting materials, by-products, intermediates, degradation products.
    - Inorganic Impurities: Catalysts, heavy metals, reagents, inorganic salts.
    - Residual Solvents: Volatile organic chemicals used in the manufacture.
    The International Council for Harmonisation (ICH) provides guidelines (Q3A, Q3B, Q3C, Q3D) for the identification, qualification, and control of these impurities. 
    Thresholds: Reporting, Identification, and Qualification thresholds are defined based on the maximum daily dose of the drug.`
  },
  {
    id: "4",
    name: "Organic Chemistry II",
    type: "Science",
    content: `Organic Chemistry II covers advanced reactions and mechanisms of carbon-based compounds.
    Key topics:
    - Aromaticity and Electrophilic Aromatic Substitution (EAS).
    - Carbonyl Chemistry: Aldehydes, Ketones, Carboxylic Acids, and Esters. 
    - Nucleophilic Acyl Substitution and Nucleophilic Addition.
    - Alpha-substitution reactions and Enolates: Aldol, Claisen, and Michael additions.
    - Amines: Synthesis and reactions.
    - Biomolecules: Carbohydrates, amino acids, proteins, and lipids.
    - Spectroscopy: NMR, IR, and Mass Spectrometry for structural elucidation.`
  }
];
