package sorting;

public class InsertionSort implements Sorter {

    public void sort(int[] input) {
        System.out.println("Insertion Sort!!!");
        for (int i = 1; i < input.length; i++) {
            int key = input[i];
            int j = i - 1;

            // Move elements of input[0..i-1], that are greater than key,
            // to one position ahead of their current position
            while (j >= 0 && input[j] > key) {
                input[j + 1] = input[j];
                j = j - 1;
            }
            input[j + 1] = key;
        }
    }
}
