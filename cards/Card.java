package cards;

public class Card {
	private int suit;
	private int value;
	final private static String[] suits = {"Hearts", "Diamonds", "Clubs", "Spades"};
	final private static String[] values = {"2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"};
	public Card(int suit, int value) {
		this.suit = suit;
		this.value = value;
	}
	public int getValue() {
		return value;
	}
	@Override
	public String toString() {
		return values[value] + " of " + suits[suit];
	}
}
