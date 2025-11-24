import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	FileText,
	Home,
	Layers,
	Package,
	Settings,
} from "lucide-react";
import { Button } from "#shadcn/components/ui/button";
import { Toaster, toast } from "#shadcn/components/ui/sonner";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarSeparator,
} from "#shadcn/components/ui/sidebar";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#shadcn/components/ui/tabs";
import {
	type FhirStructure,
	FhirStructureView,
} from "./components/fhir-structure-view";
import type { TreeViewItem } from "./components/tree-view";

const meta = {
	title: "Demo/MCPDemo",
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const sidebarItems = [
	{ title: "Home", icon: Home },
	{ title: "Profiles", icon: Layers, isActive: true },
	{ title: "Extensions", icon: Package },
	{ title: "Value Sets", icon: FileText },
	{ title: "Settings", icon: Settings },
];

const differentialTree: Record<string, TreeViewItem<FhirStructure>> = {
	root: {
		name: "Root",
		children: ["Patient"],
	},
	Patient: {
		name: "Patient",
		meta: {
			type: "Resource",
			min: "0",
			max: "*",
			desc: "US Core Patient Profile",
		},
		children: ["Patient.identifier", "Patient.name", "Patient.birthDate"],
	},
	"Patient.identifier": {
		name: "identifier",
		meta: {
			type: "Identifier",
			min: "1",
			max: "*",
			isSummary: true,
			mustSupport: true,
			desc: "An identifier for this patient (MRN, SSN, etc.)",
		},
	},
	"Patient.name": {
		name: "name",
		meta: {
			type: "HumanName",
			min: "1",
			max: "*",
			isSummary: true,
			mustSupport: true,
			desc: "A name associated with the patient",
		},
	},
	"Patient.birthDate": {
		name: "birthDate",
		meta: {
			type: "date",
			min: "1",
			max: "1",
			isSummary: true,
			mustSupport: true,
			desc: "The date of birth for the individual",
		},
	},
};

const snapshotTree: Record<string, TreeViewItem<FhirStructure>> = {
	root: {
		name: "Root",
		children: ["Patient"],
	},
	Patient: {
		name: "Patient",
		meta: {
			type: "Resource",
			min: "0",
			max: "*",
			desc: "Information about an individual receiving health care services",
		},
		children: [
			"Patient.id",
			"Patient.meta",
			"Patient.identifier",
			"Patient.active",
			"Patient.name",
			"Patient.telecom",
			"Patient.gender",
			"Patient.birthDate",
			"Patient.address",
		],
	},
	"Patient.id": {
		name: "id",
		meta: {
			type: "id",
			min: "0",
			max: "1",
			isSummary: true,
			desc: "Logical id of this artifact",
		},
	},
	"Patient.meta": {
		name: "meta",
		meta: {
			type: "Meta",
			min: "0",
			max: "1",
			isSummary: true,
			desc: "Metadata about the resource",
		},
	},
	"Patient.identifier": {
		name: "identifier",
		meta: {
			type: "Identifier",
			min: "1",
			max: "*",
			isSummary: true,
			mustSupport: true,
			desc: "An identifier for this patient",
		},
	},
	"Patient.active": {
		name: "active",
		meta: {
			type: "boolean",
			min: "0",
			max: "1",
			isSummary: true,
			isModifier: true,
			desc: "Whether this patient's record is in active use",
		},
	},
	"Patient.name": {
		name: "name",
		meta: {
			type: "HumanName",
			min: "1",
			max: "*",
			isSummary: true,
			mustSupport: true,
			desc: "A name associated with the patient",
		},
	},
	"Patient.telecom": {
		name: "telecom",
		meta: {
			type: "ContactPoint",
			min: "0",
			max: "*",
			isSummary: true,
			desc: "A contact detail for the individual",
		},
	},
	"Patient.gender": {
		name: "gender",
		meta: {
			type: "code",
			min: "0",
			max: "1",
			isSummary: true,
			desc: "male | female | other | unknown",
		},
	},
	"Patient.birthDate": {
		name: "birthDate",
		meta: {
			type: "date",
			min: "1",
			max: "1",
			isSummary: true,
			mustSupport: true,
			desc: "The date of birth for the individual",
		},
	},
	"Patient.address": {
		name: "address",
		meta: {
			type: "Address",
			min: "0",
			max: "*",
			isSummary: true,
			desc: "An address for the individual",
		},
	},
};

export const Demo = {
	render: () => (
		<SidebarProvider>
			<Sidebar>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{sidebarItems.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton isActive={item.isActive}>
											<item.icon />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
					<SidebarSeparator />
				</SidebarContent>
			</Sidebar>
			<main className="flex-1 overflow-auto">
				<div className="p-6 flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold">FHIR Structure Definition</h1>
						<Button
							variant="primary"
							onClick={() =>
								toast("ZALUPA clicked!", {
									description: "Structure definition action triggered",
								})
							}
						>
							ZALUPA
						</Button>
					</div>
					<Toaster position="top-center" />

					<Tabs defaultValue="differential">
						<TabsList>
							<TabsTrigger value="differential">Differential</TabsTrigger>
							<TabsTrigger value="snapshot">Snapshot</TabsTrigger>
						</TabsList>
						<TabsContent value="differential" className="mt-4">
							<FhirStructureView tree={differentialTree} />
						</TabsContent>
						<TabsContent value="snapshot" className="mt-4">
							<FhirStructureView tree={snapshotTree} />
						</TabsContent>
					</Tabs>
				</div>
			</main>
		</SidebarProvider>
	),
} satisfies Story;
