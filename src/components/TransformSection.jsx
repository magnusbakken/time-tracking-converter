export default function TransformSection({ onTransform, disabled }) {
  return (
    <section className="bg-panel border border-border rounded-[10px] p-4 my-4">
      <h2 className="text-xl font-semibold mb-4">3) Transform</h2>
      <button
        onClick={onTransform}
        disabled={disabled}
        className="bg-blue-500 text-white border-none rounded-lg px-3.5 py-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 hover:disabled:bg-blue-500"
      >
        Transform to Dynamics format
      </button>
    </section>
  )
}
