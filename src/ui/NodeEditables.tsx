interface NodeEditablesProps {
  id: string;
  formAction: (formData: FormData) => void;
}

export default function NodeEditables({ id, formAction }: NodeEditablesProps) {
  return <div className="editables">
    <h2>Edit state</h2>
    <form action={formAction}>
      <label htmlFor="state-name">Name of the state: </label>
      <input type="text" id="state-name" defaultValue={id} name="state-name" />

      <button type="submit">Edit state</button>
    </form>
  </div>;
}
