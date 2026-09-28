import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TASKS: Array<{ name: string; category: string; description: string }> = [
  // Errands & Daily Tasks
  {
    name: "Bill payments",
    category: "Errands & Daily Tasks",
    description: "Pay electricity, water, gas or society bills on your behalf.",
  },
  {
    name: "Bank work",
    category: "Errands & Daily Tasks",
    description: "Branch visits, form submissions and queue-standing at banks.",
  },
  {
    name: "Document pickup",
    category: "Errands & Daily Tasks",
    description: "Collect and deliver documents across the city.",
  },
  {
    name: "Queue-standing",
    category: "Errands & Daily Tasks",
    description: "Hold your place at government offices, temples or counters.",
  },
  {
    name: "Grocery pickup",
    category: "Errands & Daily Tasks",
    description: "Pick up and restock groceries from your preferred store.",
  },
  // Home Services
  {
    name: "AC service",
    category: "Home Services",
    description: "Servicing, filter cleaning and gas top-up for your units.",
  },
  {
    name: "Plumber",
    category: "Home Services",
    description: "Leaks, taps, bathrooms — vetted plumber with accountability.",
  },
  {
    name: "Electrician",
    category: "Home Services",
    description: "Wiring, switches, fittings and electrical troubleshooting.",
  },
  {
    name: "Deep cleaning",
    category: "Home Services",
    description: "Full-home deep clean including kitchens and bathrooms.",
  },
  {
    name: "Pest control",
    category: "Home Services",
    description: "Scheduled pest treatment with follow-up if needed.",
  },
  // Travel & Tourism
  {
    name: "Flight & hotel booking",
    category: "Travel & Tourism",
    description: "Research and book flights and stays to your preferences.",
  },
  {
    name: "Airport transfer",
    category: "Travel & Tourism",
    description: "Reliable pickup or drop to the airport on time.",
  },
  {
    name: "Visa paperwork",
    category: "Travel & Tourism",
    description: "Forms, appointments and document coordination for visas.",
  },
  {
    name: "Itinerary planning",
    category: "Travel & Tourism",
    description: "Day-by-day plans for trips big or small.",
  },
  {
    name: "Car rental",
    category: "Travel & Tourism",
    description: "Arrange a vetted car and driver for your travel dates.",
  },
  // Health & Medical
  {
    name: "Home doctor visit",
    category: "Health & Medical",
    description: "Coordinate a doctor visit at home with reminders and proof.",
  },
  {
    name: "Pharmacy pickup",
    category: "Health & Medical",
    description: "Collect prescribed medicines and deliver them home.",
  },
  {
    name: "Lab pickup",
    category: "Health & Medical",
    description: "Sample pickup or report collection from diagnostic labs.",
  },
  {
    name: "Physio at home",
    category: "Health & Medical",
    description: "Book and supervise physiotherapy sessions at home.",
  },
  // Senior Care
  {
    name: "Daily wellness check-ins",
    category: "Senior Care",
    description: "Regular in-person check-ins with photo proof updates.",
  },
  {
    name: "Medicine reminders",
    category: "Senior Care",
    description: "Refills and adherence support for ongoing prescriptions.",
  },
  {
    name: "Companionship",
    category: "Senior Care",
    description: "Trusted company for walks, conversations and errands.",
  },
  {
    name: "Doctor coordination",
    category: "Senior Care",
    description: "Appointments, transport and follow-ups for elder care.",
  },
];

async function main() {
  const existing = await prisma.task.count();
  if (existing > 0) {
    console.log(`Tasks already seeded (${existing}). Skipping.`);
    return;
  }

  await prisma.task.createMany({ data: TASKS });
  console.log(`Seeded ${TASKS.length} tasks across 5 categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
