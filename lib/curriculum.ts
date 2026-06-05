import type { CertId } from "@/lib/academy-data";

export type ModuleItem = {
  code: string;
  title: string;
  content: Partial<Record<CertId, string>>;
  docLink?: string;
  videoLink?: string;
  videoTitle?: string;
};

export type SectionItem = {
  title: string;
  mods: ModuleItem[];
};

export type ProductCurriculum = {
  id: "rtp" | "ttp" | "tools";
  name: string;
  icon: string;
  certs: CertId[];
  sections: SectionItem[];
};

// Initial migration set. More modules can be appended section-by-section.
export const CURRICULUM: ProductCurriculum[] = [
  {
    id: "rtp",
    name: "Ranger RTP",
    icon: "🤖",
    certs: ["pathfinder", "navigator", "grandmaster"],
    sections: [
      {
        title: "Platform & Infrastructure",
        mods: [
          {
            code: "1.1.1",
            title: "Basic Architecture",
            content: {
              pathfinder:
                "Architecture of Platform Services, Butler Server, and Integration Layer.",
              navigator:
                "System logic and flow charts for each server; System Architecture Diagram.",
              grandmaster: "High-level data flow between all modules.",
            },
            docLink:
              "https://greyorange-work.atlassian.net/wiki/spaces/BS/pages/62673505/Butler+Server+Architecture",
            videoLink:
              "https://confluence.greyorange.com/wiki/spaces/TAC/pages/training/basic-architecture-overview",
            videoTitle: "Architecture Overview Walkthrough",
          },
          {
            code: "1.1.2",
            title: "Database & Services",
            content: {
              pathfinder:
                "Platform DB/services, Butler DB/services, and Influx overview.",
              navigator:
                "System logic between Platform services, Mnesia, Integration Layer, and Kafka.",
              grandmaster:
                "Operational commands, sanity checks, and troubleshooting data flow end-to-end.",
            },
          },
          {
            code: "1.1.4",
            title: "Safety Controllers",
            content: {
              pathfinder:
                "Safety devices: Light Curtain, System Pause, Zone Pause, Fire Emergency.",
              navigator:
                "System emergency workflows and light curtain mute/unmute behavior.",
              grandmaster:
                "Tables, backend checks/commands, and troubleshooting emergency discrepancies.",
            },
          },
        ],
      },
      {
        title: "Pick Flows",
        mods: [
          {
            code: "1.2.1",
            title: "Vanilla Pick",
            content: {
              pathfinder:
                "Standard Pick to Bin flow with high-level component interactions.",
              navigator:
                "UI flow, rack selection logic, and order/task status model.",
              grandmaster:
                "Full backend data flow and mandatory checks for order assignment.",
            },
          },
          {
            code: "1.2.2",
            title: "MTU Flow",
            content: {
              pathfinder:
                "MTU problem statement, architecture overview, and key components.",
              navigator:
                "Extraction/induction UI flow and lifecycle progression by stage.",
              grandmaster:
                "Lifecycle with table-level checks, commands, and troubleshooting checklist.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "ttp",
    name: "Ranger TTP",
    icon: "📦",
    certs: ["pathfinder", "navigator", "grandmaster"],
    sections: [
      {
        title: "Platform & Infrastructure",
        mods: [
          {
            code: "2.1.1",
            title: "Basic Architecture",
            content: {
              pathfinder:
                "Content coming soon — TTP curriculum is currently under development.",
              navigator:
                "Content coming soon — TTP curriculum is currently under development.",
              grandmaster:
                "Content coming soon — TTP curriculum is currently under development.",
            },
          },
          {
            code: "2.1.3",
            title: "Conveyors",
            content: {
              pathfinder:
                "Content coming soon — TTP curriculum is currently under development.",
              navigator:
                "Content coming soon — TTP curriculum is currently under development.",
              grandmaster:
                "Content coming soon — TTP curriculum is currently under development.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "tools",
    name: "Tools & Techniques",
    icon: "🛠️",
    certs: ["toolscert"],
    sections: [
      {
        title: "Log Analysis",
        mods: [
          {
            code: "T1.1",
            title: "Kibana Logs Viewer",
            content: {
              toolscert:
                "Build KQL queries, create dashboards, and correlate logs across services.",
            },
          },
          {
            code: "T1.2",
            title: "klogviewer",
            content: {
              toolscert:
                "Parse Butler logs, identify crash reports, and inspect supervisor restarts.",
            },
          },
        ],
      },
    ],
  },
];
