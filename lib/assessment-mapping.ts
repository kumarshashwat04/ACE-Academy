import { CMETA, PRODUCTS, type CertId } from "@/lib/academy-data";
import type { CertificationModule, LevelProgress } from "@/lib/certifications";

// The quiz-id level segment used in the URL/UI differs from the internal CertId
// for the Tools track ("specialist" ↔ "toolscert"). Keep both directions in sync.
const CERT_TO_QUIZ_LEVEL: Record<CertId, string> = {
  pathfinder: "pathfinder",
  navigator: "navigator",
  grandmaster: "grandmaster",
  toolscert: "specialist",
};

const QUIZ_LEVEL_TO_CERT: Record<string, CertId> = Object.fromEntries(
  Object.entries(CERT_TO_QUIZ_LEVEL).map(([certId, quizLevel]) => [quizLevel, certId as CertId])
) as Record<string, CertId>;

// Valid quiz ids are each product paired with the certs it actually offers:
// rtp/ttp → pathfinder|navigator|grandmaster, tools → specialist.
export const VALID_QUIZ_IDS = PRODUCTS.flatMap((product) =>
  product.certs.map((certId) => `${product.id}-${CERT_TO_QUIZ_LEVEL[certId]}`)
);

export type ParsedQuizId = {
  productId: string;
  levelId: CertId;
  quizId: string;
  moduleName: string;
  levelName: string;
};

const normalized = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

export function parseQuizId(quizId: string): ParsedQuizId | null {
  const parts = quizId.split("-");
  if (parts.length < 2) return null;

  const levelSegment = parts[parts.length - 1];
  const productId = parts.slice(0, -1).join("-");

  const levelId = QUIZ_LEVEL_TO_CERT[levelSegment];
  if (!levelId) return null;

  const product = PRODUCTS.find((entry) => entry.id === productId);
  if (!product) return null;

  // The cert must actually be offered by this product (e.g. no rtp-specialist).
  if (!product.certs.includes(levelId)) return null;

  const levelMeta = CMETA[levelId];
  if (!levelMeta) return null;

  return {
    productId,
    levelId,
    quizId,
    moduleName: product.name,
    levelName: levelMeta.name,
  };
}

export function findCertModule(
  certifications: CertificationModule[],
  moduleName: string
): CertificationModule | undefined {
  return certifications.find(
    (cert) => normalized(cert.module_name) === normalized(moduleName)
  );
}

export function findCertLevel(
  certifications: CertificationModule[],
  moduleName: string,
  levelName: string
): LevelProgress | undefined {
  const mod = findCertModule(certifications, moduleName);
  if (!mod?.levels?.length) return undefined;

  return mod.levels.find(
    (level) => normalized(level.level_name) === normalized(levelName)
  );
}

const LEVEL_ORDER: CertId[] = ["pathfinder", "navigator", "grandmaster"];

export function getNextLevelName(currentLevelName: string): string | null {
  const currentNorm = normalized(currentLevelName);
  const index = LEVEL_ORDER.findIndex(
    (id) => normalized(CMETA[id].name) === currentNorm || normalized(id) === currentNorm
  );

  if (index < 0 || index >= LEVEL_ORDER.length - 1) return null;
  return CMETA[LEVEL_ORDER[index + 1]].name;
}

export function isLevelUnlocked(
  certifications: CertificationModule[],
  moduleName: string,
  levelId: CertId
): boolean {
  const level = findCertLevel(certifications, moduleName, CMETA[levelId].name);
  if (!level) return levelId === "pathfinder";
  return level.status !== "locked";
}
