export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Lead Detail: {id}</h1>
      <p className="text-muted-foreground">Lead detail view will be built by Janhavi.</p>
    </div>
  );
}
