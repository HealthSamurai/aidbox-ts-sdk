import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./shadcn/components/ui/button";
import { Card } from "./shadcn/components/ui/card";
import { Badge } from "./shadcn/components/ui/badge";
import { Input } from "./shadcn/components/ui/input";
import { Label } from "./shadcn/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/components/ui/select";
import { Textarea } from "./shadcn/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./shadcn/components/ui/tabs";
import { FhirStructureView, type FhirStructure } from "./components/fhir-structure-view";
import type { TreeViewItem } from "./components/tree-view";

const meta = {
	title: "Design/FigmaRealization",
	component: () => null,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// Sample FHIR Patient structure data
const patientStructureTree: Record<string, TreeViewItem<FhirStructure>> = {
	root: {
		id: "root",
		name: "Patient",
		children: ["meta", "identifier", "active", "name", "telecom", "gender", "birthDate", "address"],
		meta: {
			type: "Resource",
			min: "0",
			max: "*",
			short: "Information about an individual or animal receiving health care services",
		},
	},
	meta: {
		id: "meta",
		name: "meta",
		parentId: "root",
		children: ["meta.versionId", "meta.lastUpdated"],
		meta: {
			type: "Meta",
			min: "0",
			max: "1",
			isSummary: true,
			short: "Metadata about the resource",
		},
	},
	"meta.versionId": {
		id: "meta.versionId",
		name: "versionId",
		parentId: "meta",
		meta: {
			type: "id",
			min: "0",
			max: "1",
			isSummary: true,
			short: "Version specific identifier",
		},
	},
	"meta.lastUpdated": {
		id: "meta.lastUpdated",
		name: "lastUpdated",
		parentId: "meta",
		meta: {
			type: "instant",
			min: "0",
			max: "1",
			isSummary: true,
			short: "When the resource version last changed",
		},
	},
	identifier: {
		id: "identifier",
		name: "identifier",
		parentId: "root",
		children: ["identifier.system", "identifier.value"],
		meta: {
			type: "Identifier",
			min: "0",
			max: "*",
			isSummary: true,
			short: "An identifier for this patient",
		},
	},
	"identifier.system": {
		id: "identifier.system",
		name: "system",
		parentId: "identifier",
		meta: {
			type: "uri",
			min: "0",
			max: "1",
			isSummary: true,
			short: "The namespace for the identifier value",
		},
	},
	"identifier.value": {
		id: "identifier.value",
		name: "value",
		parentId: "identifier",
		meta: {
			type: "string",
			min: "0",
			max: "1",
			isSummary: true,
			short: "The value that is unique",
		},
	},
	active: {
		id: "active",
		name: "active",
		parentId: "root",
		meta: {
			type: "boolean",
			min: "0",
			max: "1",
			isSummary: true,
			isModifier: true,
			short: "Whether this patient's record is in active use",
		},
	},
	name: {
		id: "name",
		name: "name",
		parentId: "root",
		children: ["name.use", "name.family", "name.given"],
		meta: {
			type: "HumanName",
			min: "0",
			max: "*",
			isSummary: true,
			short: "A name associated with the patient",
		},
	},
	"name.use": {
		id: "name.use",
		name: "use",
		parentId: "name",
		meta: {
			type: "code",
			min: "0",
			max: "1",
			isSummary: true,
			short: "usual | official | temp | nickname | anonymous | old | maiden",
			binding: {
				valueSet: "http://hl7.org/fhir/ValueSet/name-use",
			},
		},
	},
	"name.family": {
		id: "name.family",
		name: "family",
		parentId: "name",
		meta: {
			type: "string",
			min: "0",
			max: "1",
			isSummary: true,
			short: "Family name (often called 'Surname')",
		},
	},
	"name.given": {
		id: "name.given",
		name: "given",
		parentId: "name",
		meta: {
			type: "string",
			min: "0",
			max: "*",
			isSummary: true,
			short: "Given names (not always 'first'). Includes middle names",
		},
	},
	telecom: {
		id: "telecom",
		name: "telecom",
		parentId: "root",
		children: ["telecom.system", "telecom.value", "telecom.use"],
		meta: {
			type: "ContactPoint",
			min: "0",
			max: "*",
			isSummary: true,
			short: "A contact detail for the individual",
		},
	},
	"telecom.system": {
		id: "telecom.system",
		name: "system",
		parentId: "telecom",
		meta: {
			type: "code",
			min: "0",
			max: "1",
			isSummary: true,
			short: "phone | fax | email | pager | url | sms | other",
		},
	},
	"telecom.value": {
		id: "telecom.value",
		name: "value",
		parentId: "telecom",
		meta: {
			type: "string",
			min: "0",
			max: "1",
			isSummary: true,
			short: "The actual contact point details",
		},
	},
	"telecom.use": {
		id: "telecom.use",
		name: "use",
		parentId: "telecom",
		meta: {
			type: "code",
			min: "0",
			max: "1",
			isSummary: true,
			short: "home | work | temp | old | mobile",
		},
	},
	gender: {
		id: "gender",
		name: "gender",
		parentId: "root",
		meta: {
			type: "code",
			min: "0",
			max: "1",
			isSummary: true,
			short: "male | female | other | unknown",
			binding: {
				valueSet: "http://hl7.org/fhir/ValueSet/administrative-gender",
			},
		},
	},
	birthDate: {
		id: "birthDate",
		name: "birthDate",
		parentId: "root",
		meta: {
			type: "date",
			min: "0",
			max: "1",
			isSummary: true,
			short: "The date of birth for the individual",
		},
	},
	address: {
		id: "address",
		name: "address",
		parentId: "root",
		children: ["address.use", "address.line", "address.city", "address.state", "address.postalCode", "address.country"],
		meta: {
			type: "Address",
			min: "0",
			max: "*",
			isSummary: true,
			short: "An address for the individual",
		},
	},
	"address.use": {
		id: "address.use",
		name: "use",
		parentId: "address",
		meta: {
			type: "code",
			min: "0",
			max: "1",
			isSummary: true,
			short: "home | work | temp | old | billing",
		},
	},
	"address.line": {
		id: "address.line",
		name: "line",
		parentId: "address",
		meta: {
			type: "string",
			min: "0",
			max: "*",
			isSummary: true,
			short: "Street name, number, direction & P.O. Box etc.",
		},
	},
	"address.city": {
		id: "address.city",
		name: "city",
		parentId: "address",
		meta: {
			type: "string",
			min: "0",
			max: "1",
			isSummary: true,
			short: "Name of city, town etc.",
		},
	},
	"address.state": {
		id: "address.state",
		name: "state",
		parentId: "address",
		meta: {
			type: "string",
			min: "0",
			max: "1",
			isSummary: true,
			short: "Sub-unit of country (abbreviations ok)",
		},
	},
	"address.postalCode": {
		id: "address.postalCode",
		name: "postalCode",
		parentId: "address",
		meta: {
			type: "string",
			min: "0",
			max: "1",
			isSummary: true,
			short: "Postal code for area",
		},
	},
	"address.country": {
		id: "address.country",
		name: "country",
		parentId: "address",
		meta: {
			type: "string",
			min: "0",
			max: "1",
			isSummary: true,
			short: "Country (e.g. can be ISO 3166 2 or 3 letter code)",
		},
	},
};

export const Test = {
	render: () => (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
			{/* Hero Section */}
			<div className="container mx-auto px-4 py-20">
				<div className="text-center max-w-4xl mx-auto">
					<Badge className="mb-4">New Release</Badge>
					<h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
						Build Healthcare Apps Faster with Aidbox
					</h1>
					<p className="text-xl text-slate-600 mb-8 leading-relaxed">
						A powerful TypeScript SDK and React components for building modern healthcare applications.
						FHIR-compliant, type-safe, and ready to use.
					</p>
					<div className="flex gap-4 justify-center flex-wrap">
						<Button size="large" className="px-8">
							Get Started
						</Button>
						<Button variant="outline" size="large" className="px-8">
							View Documentation
						</Button>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div className="container mx-auto px-4 py-20">
				<div className="text-center mb-12">
					<h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
						Everything you need to build healthcare apps
					</h2>
					<p className="text-lg text-slate-600">
						Powerful features that help you ship faster
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
					<Card className="p-6">
						<div className="text-4xl mb-4">⚡</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							Lightning Fast
						</h3>
						<p className="text-slate-600">
							Optimized for performance with built-in caching and efficient data fetching strategies.
						</p>
					</Card>

					<Card className="p-6">
						<div className="text-4xl mb-4">🔒</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							Type Safe
						</h3>
						<p className="text-slate-600">
							Full TypeScript support with auto-generated types from FHIR resources.
						</p>
					</Card>

					<Card className="p-6">
						<div className="text-4xl mb-4">🎨</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							Beautiful UI
						</h3>
						<p className="text-slate-600">
							Pre-built React components with Tailwind CSS for rapid development.
						</p>
					</Card>

					<Card className="p-6">
						<div className="text-4xl mb-4">📱</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							Responsive
						</h3>
						<p className="text-slate-600">
							Mobile-first design that works perfectly on all devices and screen sizes.
						</p>
					</Card>

					<Card className="p-6">
						<div className="text-4xl mb-4">🔌</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							FHIR Compliant
						</h3>
						<p className="text-slate-600">
							Built on FHIR standards ensuring interoperability with healthcare systems.
						</p>
					</Card>

					<Card className="p-6">
						<div className="text-4xl mb-4">🚀</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							Easy Integration
						</h3>
						<p className="text-slate-600">
							Simple API that integrates seamlessly with your existing React applications.
						</p>
					</Card>
				</div>
			</div>

			{/* Interactive Demo Section */}
			<div className="bg-slate-50 py-20">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
							Build Forms with Ease
						</h2>
						<p className="text-lg text-slate-600">
							Create beautiful, accessible forms with our pre-built components
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
						{/* Form Demo */}
						<Card className="p-8">
							<h3 className="text-2xl font-semibold text-slate-900 mb-6">
								Patient Registration
							</h3>
							<div className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="fullName">Full Name</Label>
									<Input
										id="fullName"
										placeholder="John Doe"
										className="w-full"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										placeholder="john.doe@example.com"
										className="w-full"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="resourceType">Resource Type</Label>
									<Select defaultValue="patient">
										<SelectTrigger id="resourceType" className="w-full">
											<SelectValue placeholder="Select resource type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="patient">Patient</SelectItem>
											<SelectItem value="practitioner">Practitioner</SelectItem>
											<SelectItem value="observation">Observation</SelectItem>
											<SelectItem value="condition">Condition</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="notes">Notes</Label>
									<Textarea
										id="notes"
										placeholder="Additional notes..."
										rows={4}
										className="w-full"
									/>
								</div>

								<Button className="w-full">Submit</Button>
							</div>
						</Card>

						{/* FHIR Structure Visualization */}
						<Card className="p-8">
							<h3 className="text-2xl font-semibold text-slate-900 mb-6">
								FHIR Patient Resource
							</h3>
							<div className="bg-slate-900 rounded-lg p-6 text-white font-mono text-sm overflow-auto max-h-[600px]">
								<pre className="text-left whitespace-pre">
{`{
  "resourceType": "Patient",
  "id": "example",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "identifier": [{
    "system": "http://hospital.org/mrn",
    "value": "12345"
  }],
  "active": true,
  "name": [{
    "use": "official",
    "family": "Doe",
    "given": ["John", "Michael"]
  }],
  "telecom": [{
    "system": "email",
    "value": "john.doe@example.com",
    "use": "home"
  }, {
    "system": "phone",
    "value": "+1-555-0123",
    "use": "mobile"
  }],
  "gender": "male",
  "birthDate": "1990-05-15",
  "address": [{
    "use": "home",
    "line": ["123 Main St"],
    "city": "Springfield",
    "state": "IL",
    "postalCode": "62701",
    "country": "USA"
  }]
}`}
								</pre>
							</div>
							<div className="mt-4 flex gap-2">
								<Badge variant="secondary">FHIR R4</Badge>
								<Badge variant="secondary">Type Safe</Badge>
								<Badge variant="secondary">Validated</Badge>
							</div>
						</Card>
					</div>
				</div>
			</div>

			{/* Stats Section */}
			<div className="bg-slate-900 text-white py-20">
				<div className="container mx-auto px-4">
					<div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
						<div>
							<div className="text-4xl font-bold mb-2">10k+</div>
							<div className="text-slate-400">Downloads</div>
						</div>
						<div>
							<div className="text-4xl font-bold mb-2">50+</div>
							<div className="text-slate-400">Components</div>
						</div>
						<div>
							<div className="text-4xl font-bold mb-2">99.9%</div>
							<div className="text-slate-400">Uptime</div>
						</div>
						<div>
							<div className="text-4xl font-bold mb-2">24/7</div>
							<div className="text-slate-400">Support</div>
						</div>
					</div>
				</div>
			</div>

			{/* FHIR Structure View Section */}
			<div className="bg-slate-50 py-20">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
							FHIR Structure Definitions
						</h2>
						<p className="text-lg text-slate-600">
							Interactive tree view for exploring FHIR resource structures
						</p>
					</div>

					<div className="max-w-7xl mx-auto">
						<Card className="p-6">
							<div className="mb-4">
								<h3 className="text-xl font-semibold text-slate-900 mb-2">
									Patient Resource Structure
								</h3>
								<p className="text-sm text-slate-600 mb-4">
									Explore the structure definition of a FHIR Patient resource with all fields, cardinalities, and types.
								</p>
								<Tabs defaultValue="structure" className="w-full">
									<TabsList>
										<TabsTrigger value="structure">Structure View</TabsTrigger>
										<TabsTrigger value="json">JSON Example</TabsTrigger>
									</TabsList>
									<TabsContent value="structure" className="mt-4">
										<div className="border rounded-lg overflow-auto max-h-[600px]">
											<FhirStructureView tree={patientStructureTree} />
										</div>
									</TabsContent>
									<TabsContent value="json" className="mt-4">
										<div className="bg-slate-900 rounded-lg p-6 text-white font-mono text-sm overflow-auto max-h-[600px]">
											<pre className="text-left whitespace-pre">
{`{
  "resourceType": "Patient",
  "id": "example",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "identifier": [{
    "system": "http://hospital.org/mrn",
    "value": "12345"
  }],
  "active": true,
  "name": [{
    "use": "official",
    "family": "Doe",
    "given": ["John", "Michael"]
  }],
  "telecom": [{
    "system": "email",
    "value": "john.doe@example.com",
    "use": "home"
  }, {
    "system": "phone",
    "value": "+1-555-0123",
    "use": "mobile"
  }],
  "gender": "male",
  "birthDate": "1990-05-15",
  "address": [{
    "use": "home",
    "line": ["123 Main St"],
    "city": "Springfield",
    "state": "IL",
    "postalCode": "62701",
    "country": "USA"
  }]
}`}
											</pre>
										</div>
									</TabsContent>
								</Tabs>
							</div>
						</Card>
					</div>
				</div>
			</div>

			{/* CTA Section */}
			<div className="container mx-auto px-4 py-20">
				<div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Ready to get started?
					</h2>
					<p className="text-xl mb-8 text-blue-100">
						Join thousands of developers building the future of healthcare
					</p>
					<div className="flex gap-4 justify-center flex-wrap">
						<Button
							variant="secondary"
							size="large"
							className="px-8 bg-white text-blue-600 hover:bg-blue-50"
						>
							Start Building
						</Button>
						<Button
							variant="outline"
							size="large"
							className="px-8 border-white text-white hover:bg-white/10"
						>
							Contact Sales
						</Button>
					</div>
				</div>
			</div>
		</div>
	),
} satisfies Story;
