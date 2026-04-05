package tower;

public class TowerSolver {
    private TowerModel model;

    public TowerSolver()
    {
        // Nothing to do here
    }

    public void solve(TowerModel model)
    {
        this.model = model;
        // Call the missing solve method (not this one)
        solver(model.height(), 0, 2, 1);
    }

    // Create an overloaded solve(...) method
    // This new method will be recursive (call itself)
    //
    // [ solve method here]
    //
    public void solver(int height, int source, int destination, int spare)
    {
        if (height == 1)
        {
            model.move(source, destination);
        }
        else
        {
            solver(height - 1, source, spare, destination);
            model.move(source, destination);
            solver(height - 1, spare, destination, source);
        }
    }

}
