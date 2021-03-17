import Snyk.MixProject.Common

defmodule Snyk.MixProject.Mix.Project do
  def load_mix_project(""), do: error("Please provide a valid path for the project")
  def load_mix_project(path) do
    mix_project = Mix.Project.in_project(:my_app, path, fn module -> module end)

    lock_file_name = get_lock_file_name(mix_project.project[:lock_file])
    lock_file_path = Path.join(path, lock_file_name)
    lock_file = read_file(lock_file_path)

    %{
      manifest: mix_project.project ++ [module_name: inspect(mix_project)],
      lock: lock_file
    }
  end

  defp read_file(path) do
    Path.expand(path) |> Code.eval_file()
  end

  defp get_lock_file_name(nil), do: get_lock_file_name("")
  defp get_lock_file_name(""), do: "mix.lock"
  defp get_lock_file_name(filename), do: filename
end
