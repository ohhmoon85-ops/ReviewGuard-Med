import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Sidebar from "@/components/Sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: hospitals } = await supabase
    .from("hospitals")
    .select("id, name, specialty")
    .eq("owner_id", user.id)
    .limit(1)

  const hospital = hospitals?.[0] || null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar hospital={hospital} />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  )
}
