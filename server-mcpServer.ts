// server/mcpServer.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { count, eq, and } from "drizzle-orm";

// Initialize the master P.A.W.S. System Operations Command Protocol
const server = new Server(
  {
    name: "paws-operations-monitor",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 1. Declare the operational tools available to the monitoring AI
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_nationwide_metrics",
        description: "Fetch real-time client registrations across all states, tracking the 5,000 free membership pool progress.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "monitor_city_staff",
        description: "Audit performance metrics, active status, and tasks resolved by hired employees in a specific territory.",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", description: "The major city name (e.g., New York, Miami)" },
            state: { type: "string", description: "Two-letter state abbreviation (e.g., NY, FL)" }
          },
          required: ["city", "state"]
        }
      },
      {
        name: "get_active_emergency_alerts",
        description: "Scan the cloud tracking matrix for unresolved or critical live IoT pet evacuation alerts.",
        inputSchema: { type: "object", properties: {} }
      }
    ],
  };
});

/**
 * 2. Handle the core analytical execution requests from the AI controller
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new Error("Google Cloud MySQL storage engine link lost.");

  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_nationwide_metrics": {
      const { users } = await import("../drizzle/schema");
      
      // Compute promo limits
      const promotionalRecords = await db.select({ value: count() }).from(users).where(eq(users.billingStatus, "promotional_free_5k"));
      const totalPromoSignedUp = promotionalRecords[0]?.value || 0;

      // Group totals to review market capture densities
      const usersList = await db.select({ city: users.city, state: users.state }).from(users);
      const geographicDensity: Record<string, number> = {};
      
      usersList.forEach(u => {
        if (u.city && u.state) {
          const key = `${u.city}, ${u.state}`;
          geographicDensity[key] = (geographicDensity[key] || 0) + 1;
        }
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            promotionType: "First 5,000 Free Accounts Tier",
            slotsClaimed: totalPromoSignedUp,
            slotsRemaining: Math.max(0, 5000 - totalPromoSignedUp),
            regionalDistributionBreakdown: geographicDensity
          }, null, 2)
        }]
      };
    }

    case "monitor_city_staff": {
      const { cityStaff } = await import("../drizzle/schema");
      const targetCity = String(args?.city);
      const targetState = String(args?.state).toUpperCase();

      const staffRecords = await db.select()
        .from(cityStaff)
        .where(and(
          eq(cityStaff.assignedCity, targetCity),
          eq(cityStaff.assignedState, targetState)
        ));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            location: `${targetCity}, ${targetState}`,
            totalHiredPersonnel: staffRecords.length,
            rosterLogs: staffRecords.map(s => ({
              employeeName: s.name,
              contact: s.email,
              status: s.status,
              totalTasksResolved: s.tasksCompleted
            }))
          }, null, 2)
        }]
      };
    }

    case "get_active_emergency_alerts": {
      const { alertHistory } = await import("../drizzle/schema");
      
      // Pull critical unacknowledged alerts that need dispatcher tracking
      const activeIncidents = await db.select()
        .from(alertHistory)
        .where(eq(alertHistory.acknowledged, 0));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            systemStatus: activeIncidents.length > 0 ? "ATTENTION_REQUIRED" : "NOMINAL",
            activeEmergencyCount: activeIncidents.length,
            incidentsList: activeIncidents
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Execution error: Unknown tool protocol '${name}' requested.`);
  }
});

/**
 * 3. Boot execution channel via standard I/O communication pathways
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[P.A.W.S. MCP] Operations interface connected via Stdio communication links.");
}

main().catch((error) => {
  console.error("[P.A.W.S. MCP FATAL ERROR] Core protocol crash:", error);
  process.exit(1);
});
- name: Github Sync
  uses: repo-sync/github-sync@v2.3.0
