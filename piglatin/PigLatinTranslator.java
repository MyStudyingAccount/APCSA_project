package piglatin;

public class PigLatinTranslator {
    public static Book translate(Book input) {
        Book translatedBook = new Book();

        // TODO: Add code here to populate translatedBook with a translation of the
        // input book.
        // Curent do-nothing code will return an empty book.
        // Your code will need to call translate(String input) many times.

        return translatedBook;
    }

    public static String translate(String input) {
        System.out.println("  -> translate('" + input + "')");

        String result = "";

        // TODO: translate a string input, store in result.
        // The input to this function could be any English string.
        // It may be made up of many words.
        // This method must call translateWord once for each word in the string.
        result = translateWord(input);

        return result;
    }

    private static String translateWord(String input) {
        System.out.println("  -> translateWord('" + input + "')");

        String result = "";

        // TODO: Replace this code to correctly translate a single word.
        int i=0;
        for (i=0;i<input.length();i++)
        {
            if ((input.charAt(i)=='a')||(input.charAt(i)=='e')||(input.charAt(i)=='i')||(input.charAt(i)=='o')||(input.charAt(i)=='u')||(input.charAt(i)=='y'))
            {
                break;
            }
        }
        //System.err.println(i);
        result=input.substring(i,input.length())+input.substring(0,i)+"ay";
        // Start here first!
        // This is the first place to work.

        return result;
    }

    // Add additonal private methods here.
    // For example, I had one like this:
    // private static String capitalizeFirstLetter(String input)

}
