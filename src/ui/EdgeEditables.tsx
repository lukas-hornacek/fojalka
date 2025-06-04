interface EdgeEditablesProps {
  char: string;
  formAction: (formData: FormData) => void;
}

export default function EdgeEditables({ char, formAction }: EdgeEditablesProps) {
  return <div className="editables">
    <h2>Edit edge</h2>
    <form action={formAction}>
      <label htmlFor="edge-character">Edge character: </label>
      <input
        type="text"
        id="edge-character"
        name="edge-character"
        defaultValue={char}

      />

      <button type="submit">Edit edge</button>
    </form>
  </div>;
}
