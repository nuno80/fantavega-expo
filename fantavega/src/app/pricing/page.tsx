import { Check } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-10 text-center">
        <h1 className="text-4xl font-bold">Pricing Plans</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Choose the perfect plan for your needs. All plans include a 14-day
          free trial.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {/* Basic Plan */}
          <div className="flex flex-col rounded-lg border p-8">
            <h3 className="text-xl font-bold">Basic</h3>
            <div className="mt-4 text-4xl font-bold">
              $9
              <span className="text-lg font-normal text-muted-foreground">
                /month
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">
              Perfect for individuals and small projects.
            </p>

            <ul className="mt-6 space-y-3 text-left">
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>Up to 5 projects</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>Basic analytics</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>24/7 support</span>
              </li>
            </ul>

            <Button className="mt-auto w-full">Get Started</Button>
          </div>

          {/* Pro Plan */}
          <div className="relative flex flex-col rounded-lg border border-primary p-8">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Most Popular
            </div>
            <h3 className="text-xl font-bold">Pro</h3>
            <div className="mt-4 text-4xl font-bold">
              $19
              <span className="text-lg font-normal text-muted-foreground">
                /month
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">
              Ideal for growing businesses and teams.
            </p>

            <ul className="mt-6 space-y-3 text-left">
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>Unlimited projects</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>Custom integrations</span>
              </li>
            </ul>

            <Button className="mt-auto w-full">Get Started</Button>
          </div>

          {/* Enterprise Plan */}
          <div className="flex flex-col rounded-lg border p-8">
            <h3 className="text-xl font-bold">Enterprise</h3>
            <div className="mt-4 text-4xl font-bold">
              $49
              <span className="text-lg font-normal text-muted-foreground">
                /month
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">
              For large organizations with advanced needs.
            </p>

            <ul className="mt-6 space-y-3 text-left">
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>Dedicated account manager</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>Custom SLA</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-2 h-5 w-5 text-primary" />
                <span>Advanced security features</span>
              </li>
            </ul>

            <Button className="mt-auto w-full">Contact Sales</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
