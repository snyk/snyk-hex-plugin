defmodule SampleApp.MixProject do
  use Mix.Project

  def project do
    [
      aliases: aliases(),
      apps_path: "apps",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  defp deps do
    []
  end

  defp aliases do
    [
      "core.reset": ["ecto.drop", "core.setup"],
      "core.seed": "run apps/core/priv/repo/seeds.exs",
      "core.setup": ["ecto.create", "ecto.migrate", "core.seed"]
    ]
  end
end
